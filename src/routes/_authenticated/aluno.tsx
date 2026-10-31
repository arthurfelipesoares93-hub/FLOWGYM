import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from '@tanstack/react-query';
import { Home, ClipboardList, Dumbbell, ChartNoAxesCombined, Wallet, Camera, UserRound, Bell } from 'lucide-react';
import { portalOptions } from '@/lib/portal';
import {Button} from '@/components/ui/button';
import {Link} from '@tanstack/react-router';
import {supabase} from '@/integrations/supabase/client';
import {useEffect} from 'react';
import type {AccessStatus} from '@/lib/auth';
import { Shell } from '@/components/app/shell';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';

export const Route = createFileRoute("/_authenticated/aluno")({ staticData: { sitemap: false },
  loader: async ({ context }) => { const p = await context.queryClient.ensureQueryData(portalOptions); if (p.admin) throw redirect({ to: '/admin' }); },
  errorComponent: PortalError,
  notFoundComponent: PortalNotFound,
  component: Page,
});

function Page() {
  const {data:p}=useSuspenseQuery(portalOptions);
  useEffect(()=>{void supabase.rpc('record_my_access');},[]);
  if((p.access as AccessStatus|null)?.status==='bloqueado')return <main className="mx-auto max-w-lg px-5 py-14"><h1 className="text-3xl font-bold uppercase">Acesso temporariamente suspenso</h1><p className="mt-5 text-sm">Existe uma pendência financeira ou suspensão definida pelo personal. Seus treinos e históricos continuam preservados. Entre em contato para conferir o pagamento e reativar seu acesso.</p><p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{p.settings?.payment_instructions}</p><Button asChild className="mt-6"><Link to="/contato">Entrar em contato</Link></Button></main>;
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
