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
