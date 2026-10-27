import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from '@tanstack/react-query';
import { Home, ClipboardList, Dumbbell, ChartNoAxesCombined, Wallet, Camera, UserRound, Bell } from 'lucide-react';
import { portalOptions } from '@/lib/portal';
import { Shell } from '@/components/app/shell';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';

export const Route = createFileRoute("/_authenticated/aluno")({
  loader: async ({ context }) => { const p = await context.queryClient.ensureQueryData(portalOptions); if (p.admin) throw redirect({ to: '/admin' }); },
  errorComponent: PortalError,
  notFoundComponent: PortalNotFound,
  component: Page,
});

function Page() {
  useSuspenseQuery(portalOptions);
  return <Shell roleLabel="Área do aluno" notificationsTo="/aluno/notificacoes" nav={[
    { to: '/aluno', label: 'Meu início', icon: Home, exact: true },
    { to: '/aluno/ficha', label: 'Minha avaliação', icon: ClipboardList },
    { to: '/aluno/treino', label: 'Meu treino', icon: Dumbbell },
    { to: '/aluno/evolucao', label: 'Evolução', icon: ChartNoAxesCombined },
    { to: '/aluno/financeiro', label: 'Financeiro', icon: Wallet },
    { to: '/aluno/fotos', label: 'Fotografias', icon: Camera },
    { to: '/aluno/notificacoes', label: 'Notificações', icon: Bell },
    { to: '/aluno/conta', label: 'Minha conta', icon: UserRound },
  ]} />;
}
