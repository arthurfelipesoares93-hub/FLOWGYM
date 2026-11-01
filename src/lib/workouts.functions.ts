import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MODEL = "openai/gpt-6-astra";

const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(150),
  muscle_group: z.string(),
  sets: z.number().int().min(1).max(20),
  reps: z.string(),
  rest_seconds: z.number().int().min(30).max(240),
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
      name: z.string().trim().min(1).max(150),
      day_of_week: z.string(),
      muscle_groups: z.string(),
      notes: z.string().nullable(),
      exercises: z.array(exerciseSchema).min(4).max(8),
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
    const { data: allowed, error: authorizationError } = await supabase.rpc("is_trainer_of", { _student_id: data.studentId });
    if (authorizationError) throw new Error('Não foi possível verificar a autorização.');
    if (!allowed) throw new Error("Acesso negado.");

    const consent = await supabase.from('students').select('data_consent_at').eq('id', data.studentId).single();
    if (consent.error || !consent.data.data_consent_at) throw new Error('O aluno precisa autorizar o uso dos dados para o acompanhamento.');

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

    const apiKey = process.env["LOVABLE_API_KEY"];
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

    const { data: settings } = await supabase.from("trainer_settings").select("methodology_guide").eq("trainer_id", userId).maybeSingle();
    const guide = settings?.methodology_guide?.trim();
    const methodology = guide ? `\n\nMETODOLOGIA DO TREINADOR (siga estas preferências como prioridade, desde que respeitem as regras de segurança acima):\n${guide.slice(0, 10000)}` : "";
    const prompt = `Ficha do aluno:\n${JSON.stringify(ficha, null, 2)}\n\nHistórico recente:\n${JSON.stringify(historico)}\n\nObservações do solicitante: ${data.extraNotes ?? "nenhuma"}${methodology}`;

    let plan: z.infer<typeof planSchema>;
    try {
      const result = streamText({
        model: provider.responses(MODEL) as never,
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

    plan = planSchema.parse(plan);
    if(plan.sessions.length !== assessment.days_per_week) throw new Error('A proposta não corresponde à disponibilidade semanal. Gere novamente.');
    plan.requires_clearance ||= !!(a.injuries || a.current_pain || a.medical_restrictions || a.movement_limitations);
    const saved=await supabase.rpc('save_ai_workout',{_student_id:data.studentId,_plan:plan,_model:MODEL});
    if(saved.error)throw new Error(saved.error.message);
    return {versionId:saved.data};
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const studentResult = await supabase.rpc("my_student_id");
    if(studentResult.error)throw new Error(studentResult.error.message);
    const sid=studentResult.data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (sid) {
      for (const bucket of ["body-photos", "receipts"]) {
        let offset=0;const paths:string[]=[];
        while(true){const result=await supabaseAdmin.storage.from(bucket).list(sid,{limit:1000,offset});if(result.error)throw new Error('Não foi possível conferir todos os arquivos. A exclusão foi interrompida.');const files=result.data??[];paths.push(...files.map(f=>`${sid}/${f.name}`));if(files.length<1000)break;offset+=1000;}
        for(let i=0;i<paths.length;i+=100){const removed=await supabaseAdmin.storage.from(bucket).remove(paths.slice(i,i+100));if(removed.error)throw new Error('Não foi possível excluir todos os arquivos. Tente novamente.');}
      }
      const removed=await supabaseAdmin.from("students").delete().eq("id",sid);
      if(removed.error)throw new Error('Não foi possível excluir os dados da conta.');
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;
    return { ok: true };
  });
