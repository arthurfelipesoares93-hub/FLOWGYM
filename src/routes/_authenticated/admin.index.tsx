import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { TrainerDashboard } from '@/components/app/trainer-dashboard';
export const Route = createFileRoute('/_authenticated/admin/')({ head: () => ({ meta: [{ title: 'Visão geral — Forja' }, { name: 'description', content: 'Acompanhamento dos alunos, avaliações, treinos e pagamentos.' }, { property: 'og:title', content: 'Visão geral — Forja' }, { property: 'og:description', content: 'Acompanhamento dos alunos, avaliações, treinos e pagamentos.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(portalOptions), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { return <TrainerDashboard />; }
