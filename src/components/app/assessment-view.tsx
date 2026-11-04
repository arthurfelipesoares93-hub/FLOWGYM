import type { Tables } from "@/integrations/supabase/types";
import { ageFrom, dateBR, goalOptions, hasMeaningfulText } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

type A = Tables<"assessments">;

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr] gap-2 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="whitespace-pre-wrap font-medium">{v || "—"}</dd>
    </div>
  );
}

function hasHealthFlags(a: Partial<A> | null | undefined) {
  return !!(
    a &&
    [a.injuries, a.current_pain, a.movement_limitations, a.medical_restrictions].some(
      hasMeaningfulText,
    )
  );
}

export function AssessmentView({ a }: { a: A }) {
  const goals = a.goals.map((g) => goalOptions.find((o) => o[0] === g)?.[1] ?? g).join(", ");
  return (
    <div className="space-y-4">
      {hasHealthFlags(a) && (
        <div className="flex gap-2 rounded-lg border border-warning/50 bg-warning/15 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-foreground" />
          <span>
            O aluno informou lesões, dores, limitações ou restrições médicas. Exercícios
            potencialmente inadequados exigem avaliação profissional antes da liberação.
          </span>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-lg font-semibold">Dados pessoais</h3>
          <dl>
            <Row k="Nome" v={a.full_name} />
            <Row
              k="Nascimento"
              v={a.birth_date ? `${dateBR(a.birth_date)} (${ageFrom(a.birth_date)} anos)` : null}
            />
            <Row k="Altura" v={a.height_cm ? `${a.height_cm} cm` : null} />
            <Row
              k="Peso"
              v={
                a.weight_kg
                  ? `${a.weight_kg} kg (atualizado em ${dateBR(a.weight_updated_at)})`
                  : null
              }
            />
          </dl>
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold">Objetivos e experiência</h3>
          <dl>
            <Row k="Objetivos" v={goals} />
            <Row k="Outro objetivo" v={a.goal_other} />
            <Row k="Nível" v={a.experience_level} />
            <Row k="Tempo de musculação" v={a.experience_time} />
          </dl>
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold">Disponibilidade</h3>
          <dl>
            <Row k="Dias por semana" v={a.days_per_week} />
            <Row k="Tempo por sessão" v={a.session_minutes ? `${a.session_minutes} min` : null} />
            <Row k="Dias disponíveis" v={a.available_days.join(", ")} />
            <Row k="Local" v={a.training_location} />
            <Row k="Equipamentos" v={a.equipment} />
          </dl>
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold">Saúde e limitações</h3>
          <dl>
            <Row k="Lesões" v={a.injuries} />
            <Row k="Dores atuais" v={a.current_pain} />
            <Row k="Limitações" v={a.movement_limitations} />
            <Row k="Restrições médicas" v={a.medical_restrictions} />
            <Row k="Observações" v={a.other_notes} />
          </dl>
        </div>
        <div>
          <h3 className="mb-1 text-lg font-semibold">Atividades adicionais</h3>
          <dl>
            <Row k="Atividades" v={a.other_activities} />
            <Row k="Frequência" v={a.activities_frequency} />
            <Row k="Duração" v={a.activities_duration} />
          </dl>
        </div>
      </div>
    </div>
  );
}
