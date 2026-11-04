import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ErrorBox, EmptyState } from "./ui-bits";
export function PortalError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="space-y-4 p-6">
      <ErrorBox error={error} />
      <Button onClick={() => router.invalidate()}>Tentar novamente</Button>
    </div>
  );
}
export function PortalNotFound() {
  return <EmptyState title="Registro não encontrado" />;
}

export function PendingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col gap-4 p-4 sm:p-6"
    >
      <span className="sr-only">Carregando…</span>
      <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
