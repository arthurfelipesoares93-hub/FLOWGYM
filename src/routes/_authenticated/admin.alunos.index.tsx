import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { portalOptions, studentOptions } from "@/lib/portal";
import { PortalError, PortalNotFound } from "@/components/app/route-feedback";
import { StudentList } from "@/components/app/trainer-dashboard";
import { PageHeader, Field } from "@/components/app/ui-bits";
import { Input } from "@/components/ui/input";
import { managementOptions } from "@/lib/management";
import { inactivityLevel } from "@/lib/management-rules";
import { financialLabels } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/admin/alunos/")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>) =>
    ({
      q: typeof s["q"] === "string" ? (s["q"] as string) : undefined,
      status: typeof s["status"] === "string" ? (s["status"] as string) : undefined,
    }) as { q?: string | undefined; status?: string | undefined },
  head: () => ({
    meta: [
      { title: "Alunos — Team Oliveira" },
      { name: "description", content: "Alunos acompanhados pelo treinador." },
      { property: "og:title", content: "Alunos — Team Oliveira" },
      { property: "og:description", content: "Alunos acompanhados pelo treinador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(portalOptions),
      context.queryClient.ensureQueryData(managementOptions),
    ]);
  },
  errorComponent: PortalError,
  notFoundComponent: PortalNotFound,
  component: Page,
});
function Page() {
  const { data: p } = useSuspenseQuery(portalOptions);
  const { data: m } = useSuspenseQuery(managementOptions);
  const [filter, setFilter] = useState("");
  const { q = "", status = "" } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <div className="space-y-5">
      <PageHeader
        title="CRM e Gestão de Alunos"
        actions={
          <Button asChild>
            <Link to="/admin/crm">Cadastrar / convidar aluno</Link>
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Buscar aluno">
          <Input
            value={q}
            onChange={(e) =>
              navigate({
                search: (prev: { q?: string | undefined; status?: string | undefined }) => ({
                  ...prev,
                  q: e.target.value || undefined,
                }),
              })
            }
            placeholder="Nome, telefone ou e-mail"
          />
        </Field>
        <Field label="Situação financeira">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={status}
            onChange={(e) =>
              navigate({
                search: (prev: { q?: string | undefined; status?: string | undefined }) => ({
                  ...prev,
                  status: e.target.value || undefined,
                }),
              })
            }
          >
            <option value="">Todas</option>
            {["em_dia", "proximo", "pendente", "atrasado", "bloqueado", "inativo"].map((x) => (
              <option key={x} value={x}>
                {financialLabels[x]?.label ?? x}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Acompanhamento">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Todos os alunos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
            <option value="sem_treino">Sem registro de treino</option>
            <option value="sem_evolucao">Sem atualizar evolução</option>
            <option value="contato">Precisam de contato</option>
          </select>
        </Field>
      </div>
      <StudentList
        students={p.students.filter(
          (s) =>
            (!q ||
              `${s.full_name} ${s.email} ${m.profiles.find((p) => p.id === m.students.find((x) => x.id === s.student_id)?.user_id)?.phone ?? ""}`
                .toLowerCase()
                .includes(q.toLowerCase())) &&
            (!status || s.financial_status === status) &&
            (!filter ||
              (filter === "ativo" || filter === "inativo"
                ? m.students.find((x) => x.id === s.student_id)?.accompaniment_status === filter
                : filter === "sem_treino"
                  ? !s.last_training
                  : filter === "sem_evolucao"
                    ? !m.progress.some((x) => x.student_id === s.student_id)
                    : Boolean(
                        inactivityLevel(
                          s.last_training,
                          m.assessments.find((x) => x.student_id === s.student_id)?.submitted_at ??
                            null,
                          m.assessments.find((x) => x.student_id === s.student_id)
                            ?.available_days ?? [],
                        ),
                      ))),
        )}
      />
    </div>
  );
}
