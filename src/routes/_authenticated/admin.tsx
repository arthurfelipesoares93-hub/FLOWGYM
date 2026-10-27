import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from '@tanstack/react-query';
import { Users, LayoutDashboard, Settings, Bell } from 'lucide-react';
import { portalOptions } from '@/lib/portal';
import { Shell } from '@/components/app/shell';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';

export const Route = createFileRoute("/_authenticated/admin")({
  loader: async ({ context }) => { const p = await context.queryClient.ensureQueryData(portalOptions); if (!p.admin) throw redirect({ to: '/aluno' }); },
  errorComponent: PortalError,
  notFoundComponent: PortalNotFound,
  component: Page,
});

function Page() {
  useSuspenseQuery(portalOptions);
  return <Shell roleLabel="Área do treinador" notificationsTo="/admin/notificacoes" nav={[
    { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, exact: true },
    { to: '/admin/alunos', label: 'Alunos', icon: Users },
    { to: '/admin/notificacoes', label: 'Notificações', icon: Bell },
    { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
  ]} />;
}
