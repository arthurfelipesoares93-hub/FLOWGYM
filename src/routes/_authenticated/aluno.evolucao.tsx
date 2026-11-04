import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { portalOptions, studentOptions } from "@/lib/portal";
import { PortalError, PortalNotFound } from "@/components/app/route-feedback";
import { ProgressGoals } from "@/components/app/progress-goals";
import { StudentJourney } from "@/components/app/student-journey";
import { Performance } from "@/components/app/performance";
import { PageHeader } from "@/components/app/ui-bits";
export const Route = createFileRoute("/_authenticated/aluno/evolucao")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Minha evolução — Team Oliveira" },
      { name: "description", content: "Histórico de sessões e evolução das cargas." },
      { property: "og:title", content: "Minha evolução — Team Oliveira" },
      { property: "og:description", content: "Histórico de sessões e evolução das cargas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(studentOptions()),
  errorComponent: PortalError,
  notFoundComponent: PortalNotFound,
  component: Page,
});
function Page() {
  const { data: d } = useSuspenseQuery(studentOptions());
  return (
    <>
      <PageHeader title="Minha evolução" />
      <ProgressGoals studentId={d.student.id} />
      <StudentJourney studentId={d.student.id} goalPerWeek={d.assessment?.days_per_week ?? 3} />
      <Performance studentId={d.student.id} />
    </>
  );
}
