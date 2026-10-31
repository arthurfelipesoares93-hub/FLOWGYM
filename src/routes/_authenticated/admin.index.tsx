import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import {managementOptions} from '@/lib/management';
import { TrainerDashboard } from '@/components/app/trainer-dashboard';
export const Route = createFileRoute('/_authenticated/admin/')({ staticData: { sitemap: false }, head: () => ({ meta: [{ title: 'Visão geral — Team Oliveira' }, { name: 'description', content: 'Acompanhamento dos alunos, avaliações, treinos e pagamentos.' }, { property: 'og:title', content: 'Visão geral — Team Oliveira' }, { property: 'og:description', content: 'Acompanhamento dos alunos, avaliações, treinos e pagamentos.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: async ({ context }) => {await Promise.all([context.queryClient.ensureQueryData(portalOptions),context.queryClient.ensureQueryData(managementOptions)]);}, errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { return <TrainerDashboard />; }
