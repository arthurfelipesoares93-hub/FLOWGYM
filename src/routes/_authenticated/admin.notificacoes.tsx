import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { NotificationsPage } from '@/components/app/notifications-list';
export const Route = createFileRoute('/_authenticated/admin/notificacoes')({ head: () => ({ meta: [{ title: 'Notificações do treinador — Team Oliveira' }, { name: 'description', content: 'Avisos sobre treinos, avaliações e pagamentos.' }, { property: 'og:title', content: 'Notificações do treinador — Team Oliveira' }, { property: 'og:description', content: 'Avisos sobre treinos, avaliações e pagamentos.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(portalOptions), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { return <NotificationsPage />; }
