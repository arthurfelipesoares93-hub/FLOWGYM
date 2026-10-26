import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/app/notifications-list";

export const Route = createFileRoute("/_authenticated/aluno")({
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-2 text-3xl font-bold uppercase">Painel em construção</h1>
      <p className="mb-6 text-sm text-muted-foreground">Esta área ainda está sendo finalizada.</p>
      <NotificationsPage />
    </div>
  );
}
