import { createFileRoute } from "@tanstack/react-router";
import { managementOptions } from "@/lib/management";
import { RankingPage } from "@/components/app/ranking-page";
import { PortalError } from "@/components/app/route-feedback";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/_authenticated/admin/ranking")({
  staticData: { sitemap: false },
  head: () =>
    pageHead(
      "Ranking de alunos",
      "Classificação dos alunos por XP, sequência semanal e meta da semana.",
    ),
  validateSearch: (search: Record<string, unknown>): { demo?: boolean } =>
    search["demo"] === "1" || search["demo"] === 1 || search["demo"] === true ? { demo: true } : {},
  loader: ({ context }) => context.queryClient.ensureQueryData(managementOptions),
  component: Page,
  errorComponent: PortalError,
});

function Page() {
  const { demo } = Route.useSearch();
  return <RankingPage demo={!!demo} />;
}
