import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";

const exerciseSchema = z.object({
  name: z.string(),
  muscle_group: z.string(),
  sets: z.number(),
  reps: z.string(),
  rest_seconds: z.number(),
  instructions: z.string(),
  alternatives: z.string(),
  notes: z.string().nullable(),
});
const planSchema = z.object({
  title: z.string(),
  summary: z.string(),
  weekly_split: z.string(),
  progression: z.string(),
  cautions: z.string(),
  requires_clearance: z.boolean(),
  sessions: z.array(
    z.object({
      name: z.string(),
      day_of_week: z.string(),
      muscle_groups: z.string(),
      notes: z.string().nullable(),
      exercises: z.array(exerciseSchema),
    }),
  ),
});

export const generateWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId: string; extraNotes?: string }) =>
    z.object({ studentId: z.string().uuid(), extraNotes: z.string().max(2000).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Authorization through RLS-aware RPC (never trust browser ids)
    const { data: allowed } = await supabase.rpc("can_access_student", { _student_id: data.studentId });
    if (!allowed) throw new Error("Acesso negado.");

    const { data: assessment } = await supabase.from("assessments").select("*").eq("student_id", data.studentId).maybeSingle();
    if (!assessment?.submitted_at) throw new Error("A ficha de avaliação precisa ser enviada antes de gerar um treino.");

    const { data: pending } = await supabase.from("workout_versions").select("id").eq("student_id", data.studentId).in("status", ["pendente"]).limit(1);
    if (pending && pending.length) throw new Error("Já existe um treino pendente de revisão para este aluno.");

    // Recent performance as context (reference only; never auto-publishes)
    const { data: logs } = await supabase
      .from("exercise_logs")
      .select("performed_on, set_details, completed, workout_exercises(name)")
      .eq("student_id", data.studentId)
      .order("performed_on", { ascending: false })
      .limit(40);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Integração de IA não configurada (LOVABLE_API_KEY ausente).");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    let runId: string | undefined;
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
        const res = await fetch(input, { ...init, headers });
        runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
        if (!res.ok) {
          const body = await res.clone().text().catch(() => "");
          if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos ao workspace para continuar.");
          if (res.status === 429) throw new Error("Limite de requisições de IA atingido. Tente novamente em alguns minutos.");
          if (res.status === 403) throw new Error("O uso de IA está bloqueado para este workspace. " + body.slice(0, 200));
        }
        return res;
      },
    });

    const a = assessment;
    const ficha = {
      idade_nascimento: a.birth_date, altura_cm: a.height_cm, peso_kg: a.weight_kg,
      objetivos: a.goals, outro_objetivo: a.goal_other, nivel: a.experience_level, tempo_experiencia: a.experience_time,
      dias_por_semana: a.days_per_week, minutos_por_sessao: a.session_minutes, dias_disponiveis: a.available_days,
      local: a.training_location, equipamentos: a.equipment,
      lesoes: a.injuries, dores_atuais: a.current_pain, limitacoes: a.movement_limitations,
      restricoes_medicas: a.medical_restrictions, observacoes: a.other_notes,
      outras_atividades: a.other_activities, frequencia_atividades: a.activities_frequency, duracao_atividades: a.activities_duration,
    };
    const historico = (logs ?? []).map((l) => ({
      data: l.performed_on,
      exercicio: (l.workout_exercises as { name: string } | null)?.name,
      series: l.set_details,
      concluido: l.completed,
    }));

    const system = `Você é um assistente de prescrição de treinamento de força para um treinador profissional brasileiro.
Gere uma PROPOSTA de treino em português do Brasil que será revisada pelo treinador antes de chegar ao aluno.
Regras:
- Respeite objetivo, nível, dias disponíveis (exatamente o número de sessões compatível com dias_por_semana), tempo por sessão, local e equipamentos.
- Considere as atividades adicionais para controlar o volume total.
- NUNCA presuma que uma lesão, dor ou restrição médica está liberada. Se houver qualquer lesão, dor atual, limitação ou restrição médica relevante, marque requires_clearance=true, explique em "cautions" que é necessária avaliação profissional adequada (médico/fisioterapeuta) e evite exercícios que sobrecarreguem a região afetada.
- Não faça diagnósticos.
- Cada sessão deve ter de 4 a 8 exercícios. Use reps como texto (ex.: "8-12" ou "30 s"). rest_seconds entre 30 e 240.
- instructions: orientação de execução curta. alternatives: 1 a 2 exercícios substitutos.
- progression: progressão planejada para as próximas 4 a 8 semanas.
- Use o histórico de desempenho apenas como referência de cargas e aderência.`;

    const prompt = `Ficha do aluno:\n${JSON.stringify(ficha, null, 2)}\n\nHistórico recente:\n${JSON.stringify(historico)}\n\nObservações do solicitante: ${data.extraNotes ?? "nenhuma"}`;

    let plan: z.infer<typeof planSchema>;
    try {
      const result = streamText({
        model: provider.responses(MODEL),
        system,
        prompt,
        output: Output.object({ schema: planSchema }),
        providerOptions: {
          openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] },
        },
      });
      plan = (await result.output) as z.infer<typeof planSchema>;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) throw new Error("A IA não retornou um treino válido. Tente novamente.");
      throw e instanceof Error ? e : new Error("Falha ao gerar treino com IA.");
    }
    if (!plan?.sessions?.length) throw new Error("A IA não retornou sessões de treino.");

    // Privileged inserts only after the caller was authorized above. Status is ALWAYS 'pendente'.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("workouts").select("id").eq("student_id", data.studentId).limit(1).maybeSingle();
    let workoutId = existing?.id;
    if (!workoutId) {
      const { data: w, error } = await supabaseAdmin.from("workouts").insert({ student_id: data.studentId, title: plan.title.slice(0, 120), created_by: userId }).select("id").single();
      if (error) throw error;
      workoutId = w.id;
    }
    const { data: maxV } = await supabaseAdmin.from("workout_versions").select("version_number").eq("workout_id", workoutId).order("version_number", { ascending: false }).limit(1).maybeSingle();
    const { data: version, error: vErr } = await supabaseAdmin
      .from("workout_versions")
      .insert({
        workout_id: workoutId, student_id: data.studentId, version_number: (maxV?.version_number ?? 0) + 1,
        status: "pendente", source: "ia", ai_model: MODEL, summary: plan.summary, weekly_split: plan.weekly_split,
        progression: plan.progression, cautions: plan.cautions,
        requires_clearance: plan.requires_clearance || !!(a.injuries || a.current_pain || a.medical_restrictions || a.movement_limitations),
        created_by: userId,
      })
      .select("id")
      .single();
    if (vErr) throw vErr;

    for (const [i, s] of plan.sessions.entries()) {
      const { data: sess, error } = await supabaseAdmin
        .from("workout_sessions")
        .insert({ version_id: version.id, position: i, name: s.name, day_of_week: s.day_of_week, muscle_groups: s.muscle_groups, notes: s.notes })
        .select("id")
        .single();
      if (error) throw error;
      const rows = s.exercises.map((e, j) => ({
        session_id: sess.id, version_id: version.id, position: j, name: e.name, muscle_group: e.muscle_group,
        sets: Math.min(20, Math.max(1, Math.round(e.sets || 3))), reps: e.reps || "10",
        rest_seconds: Math.min(900, Math.max(0, Math.round(e.rest_seconds || 60))),
        instructions: e.instructions, alternatives: e.alternatives, notes: e.notes,
      }));
      const { error: exErr } = await supabaseAdmin.from("workout_exercises").insert(rows);
      if (exErr) throw exErr;
    }
    await supabaseAdmin.from("workout_reviews").insert({ version_id: version.id, action: "gerado_ia", notes: `Gerado por ${MODEL}`, reviewer_id: userId });
    await supabaseAdmin.from("audit_logs").insert({ actor_id: userId, student_id: data.studentId, action: "treino_gerado_ia", entity: "workout_versions", entity_id: version.id, details: { modelo: MODEL } });
    return { versionId: version.id };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: sid } = await supabase.rpc("my_student_id");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (sid) {
      for (const bucket of ["body-photos", "receipts"]) {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(sid as string, { limit: 1000 });
        if (files?.length) await supabaseAdmin.storage.from(bucket).remove(files.map((f) => `${sid}/${f.name}`));
      }
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { ok: true };
  });
