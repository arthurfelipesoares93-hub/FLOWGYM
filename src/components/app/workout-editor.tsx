import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateWorkout } from "@/lib/workouts.functions";
import type { StudentData } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { Field, EmptyState, Loading, ErrorBox, StatusBadge, Section } from "./ui-bits";
import { useAction, check } from "./actions";
import { fetchVersion, type FullVersion, type Exercise } from "./workout-data";
import { WorkoutView } from "./workout-view";
import { workoutLabels, dateTimeBR } from "@/lib/format";

export function TrainerWorkouts({ d }: { d: StudentData }) {
  const [selected, setSelected] = useState("");
  const id = selected || d.versions[0]?.id;
  const action = useAction();
  const generate = useServerFn(generateWorkout);
  const [extra, setExtra] = useState("");
  const [manualName, setManualName] = useState("");
  const q = useQuery({
    queryKey: ["version", id],
    enabled: !!id,
    queryFn: () => (id ? fetchVersion(id) : null),
  });
  return (
    <div className="space-y-5">
      <Section title="Criar treino manual">
        <Field label="Nome / objetivo do treino">
          <Input
            maxLength={120}
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
        </Field>
        <Button
          className="mt-3"
          disabled={action.isPending || !manualName.trim()}
          onClick={() =>
            action.mutate(async () => {
              const id = check(
                await supabase.rpc("create_manual_workout", {
                  _student_id: d.student.id,
                  _title: manualName,
                }),
              );
              setSelected(id);
            })
          }
        >
          <Plus className="h-4 w-4" />
          Criar treino manual
        </Button>
      </Section>
      <Section title="Gerar proposta com IA">
        <Field label="Orientações adicionais">
          <Textarea value={extra} onChange={(e) => setExtra(e.target.value)} />
        </Field>
        <Button
          className="mt-3"
          disabled={
            action.isPending ||
            !d.assessment?.submitted_at ||
            d.versions.some((v) => v.status === "pendente")
          }
          onClick={() =>
            action.mutate(async () => {
              const r = await generate({ data: { studentId: d.student.id, extraNotes: extra } });
              setSelected(r.versionId);
            })
          }
        >
          <Sparkles className="h-4 w-4" />
          {action.isPending ? "Aguarde..." : "Gerar treino com IA"}
        </Button>
      </Section>
      {!!d.versions.length && (
        <Field label="Versão do treino">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {d.versions.map((v) => (
              <option key={v.id} value={v.id}>
                Versão {v.version_number} · {workoutLabels[v.status]?.label} ·{" "}
                {dateTimeBR(v.created_at)}
              </option>
            ))}
          </select>
        </Field>
      )}
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorBox error={q.error} />
      ) : q.data ? (
        <VersionEditor
          key={q.data.id + q.data.updated_at + q.data.status}
          v={q.data}
          onRevision={setSelected}
        />
      ) : (
        <EmptyState title="Nenhum treino criado" />
      )}
    </div>
  );
}

function VersionEditor({ v, onRevision }: { v: FullVersion; onRevision: (id: string) => void }) {
  const [draft, setDraft] = useState(v);
  const [editing, setEditing] = useState(false);
  const [review, setReview] = useState("");
  const action = useAction();
  const editable = ["pendente", "ajustes"].includes(v.status);
  const reviews = useQuery({
    queryKey: ["workout-reviews", v.id],
    queryFn: async () =>
      check(
        await supabase
          .from("workout_reviews")
          .select("*")
          .eq("version_id", v.id)
          .order("created_at", { ascending: false }),
      ),
  });
  const updateExercise = (sid: string, eid: string, key: keyof Exercise, value: string | number) =>
    setDraft((p) => ({
      ...p,
      sessions: p.sessions.map((s) =>
        s.id === sid
          ? { ...s, exercises: s.exercises.map((e) => (e.id === eid ? { ...e, [key]: value } : e)) }
          : s,
      ),
    }));
  async function save() {
    check(
      await supabase
        .from("workout_versions")
        .update({
          summary: draft.summary,
          weekly_split: draft.weekly_split,
          progression: draft.progression,
          cautions: draft.cautions,
          trainer_notes: draft.trainer_notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", v.id),
    );
    for (const s of draft.sessions) {
      check(
        await supabase.from("workout_sessions").upsert({
          id: s.id,
          version_id: v.id,
          position: s.position,
          name: s.name,
          day_of_week: s.day_of_week,
          muscle_groups: s.muscle_groups,
          notes: s.notes,
        }),
      );
      const removed =
        v.sessions
          .find((x) => x.id === s.id)
          ?.exercises.filter((e) => !s.exercises.some((x) => x.id === e.id)) ?? [];
      for (const e of removed)
        check(await supabase.from("workout_exercises").delete().eq("id", e.id));
      for (const ex of s.exercises) {
        if (ex.video_url && !/^https:\/\//.test(ex.video_url))
          throw new Error("Use um link https para o vídeo.");
      }
      for (const [position, e] of s.exercises.entries())
        check(await supabase.from("workout_exercises").upsert({ ...e, position }));
    }
    setEditing(false);
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge map={workoutLabels} value={v.status} />
        <Button
          variant="outline"
          disabled={action.isPending}
          onClick={() =>
            editable
              ? setEditing(!editing)
              : action.mutate(async () =>
                  onRevision(
                    check(await supabase.rpc("create_workout_revision", { _version_id: v.id })),
                  ),
                )
          }
        >
          {editable ? (editing ? "Voltar à visualização" : "Editar treino") : "Criar nova revisão"}
        </Button>
      </div>
      {editing ? (
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            action.mutate(save);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(["summary", "weekly_split", "progression", "cautions", "trainer_notes"] as const).map(
              (key, i) => (
                <Field
                  key={key}
                  label={
                    [
                      "Resumo",
                      "Divisão semanal",
                      "Progressão",
                      "Cuidados",
                      "Observações do treinador",
                    ][i] ?? key
                  }
                >
                  <Textarea
                    value={draft[key] ?? ""}
                    onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                  />
                </Field>
              ),
            )}
          </div>
          {draft.sessions.map((s) => (
            <Section key={s.id} title={s.name}>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <Field label="Nome da sessão">
                  <Input
                    required
                    value={s.name}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        sessions: p.sessions.map((x) =>
                          x.id === s.id ? { ...x, name: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
                <Field label="Dia da semana">
                  <Input
                    value={s.day_of_week ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        sessions: p.sessions.map((x) =>
                          x.id === s.id ? { ...x, day_of_week: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </Field>
              </div>
              {s.exercises.map((e) => (
                <div key={e.id} className="mb-4 border-b pb-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <Field label="Exercício">
                      <Input
                        required
                        value={e.name}
                        onChange={(x) => updateExercise(s.id, e.id, "name", x.target.value)}
                      />
                    </Field>
                    <Field label="Grupo muscular">
                      <Input
                        value={e.muscle_group ?? ""}
                        onChange={(x) => updateExercise(s.id, e.id, "muscle_group", x.target.value)}
                      />
                    </Field>
                    <Field label="Séries">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={e.sets}
                        onChange={(x) => updateExercise(s.id, e.id, "sets", Number(x.target.value))}
                      />
                    </Field>
                    <Field label="Repetições">
                      <Input
                        required
                        value={e.reps}
                        onChange={(x) => updateExercise(s.id, e.id, "reps", x.target.value)}
                      />
                    </Field>
                    <Field label="Descanso (s)">
                      <Input
                        type="number"
                        min={0}
                        max={900}
                        required
                        value={e.rest_seconds}
                        onChange={(x) =>
                          updateExercise(s.id, e.id, "rest_seconds", Number(x.target.value))
                        }
                      />
                    </Field>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(["instructions", "alternatives", "notes", "video_url"] as const).map(
                      (key, i) => (
                        <Field
                          key={key}
                          label={
                            [
                              "Execução",
                              "Alternativas",
                              "Observações",
                              "Vídeo demonstrativo (URL https)",
                            ][i] ?? key
                          }
                        >
                          <Textarea
                            value={e[key] ?? ""}
                            onChange={(x) => updateExercise(s.id, e.id, key, x.target.value)}
                          />
                        </Field>
                      ),
                    )}
                  </div>
                  <Button
                    type="button"
                    className="mt-2"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        sessions: p.sessions.map((x) =>
                          x.id === s.id
                            ? { ...x, exercises: x.exercises.filter((y) => y.id !== e.id) }
                            : x,
                        ),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover exercício
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDraft((p) => ({
                    ...p,
                    sessions: p.sessions.map((x) =>
                      x.id === s.id
                        ? {
                            ...x,
                            exercises: [
                              ...x.exercises,
                              {
                                id: crypto.randomUUID(),
                                session_id: s.id,
                                version_id: v.id,
                                position: x.exercises.length,
                                name: "",
                                muscle_group: "",
                                sets: 3,
                                reps: "10",
                                rest_seconds: 60,
                                instructions: "",
                                alternatives: "",
                                notes: "",
                                video_url: null,
                              },
                            ],
                          }
                        : x,
                    ),
                  }))
                }
              >
                <Plus className="h-4 w-4" />
                Adicionar exercício
              </Button>
            </Section>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDraft((p) => ({
                ...p,
                sessions: [
                  ...p.sessions,
                  {
                    id: crypto.randomUUID(),
                    version_id: v.id,
                    position: p.sessions.length,
                    name: `Treino ${p.sessions.length + 1}`,
                    day_of_week: null,
                    muscle_groups: null,
                    notes: null,
                    exercises: [],
                  },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar sessão
          </Button>
          <Button disabled={action.isPending}>Salvar alterações</Button>
        </form>
      ) : (
        <WorkoutView v={v} />
      )}
      {editable && !editing && (
        <Section title="Revisão do treinador">
          <Field label="Observações da revisão">
            <Textarea value={review} onChange={(e) => setReview(e.target.value)} />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { a: "aprovar", label: "Aprovar e liberar" },
              { a: "ajustes", label: "Devolver para ajustes" },
              { a: "reprovar", label: "Reprovar" },
            ].map((x) => (
              <Button
                key={x.a}
                variant={x.a === "aprovar" ? "default" : "outline"}
                disabled={action.isPending}
                onClick={() =>
                  action.mutate(async () => {
                    if (x.a !== "aprovar" && !review.trim())
                      throw new Error("Informe o motivo da revisão.");
                    check(
                      await supabase.rpc("review_workout_version", {
                        _version_id: v.id,
                        _action: x.a,
                        _notes: review,
                      }),
                    );
                  })
                }
              >
                {x.label}
              </Button>
            ))}
          </div>
        </Section>
      )}
      <Section title="Histórico da revisão">
        {reviews.data?.map((r) => (
          <div key={r.id} className="border-b py-2 text-sm">
            <b>{r.action}</b> · {dateTimeBR(r.created_at)}
            <p className="text-muted-foreground">{r.notes}</p>
          </div>
        ))}
      </Section>
    </div>
  );
}
