import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { Performance } from '@/components/app/performance';
import { PageHeader } from '@/components/app/ui-bits';
export const Route = createFileRoute('/_authenticated/aluno/evolucao')({ head: () => ({ meta: [{ title: 'Minha evolução — Forja' }, { name: 'description', content: 'Histórico de sessões e evolução das cargas.' }, { property: 'og:title', content: 'Minha evolução — Forja' }, { property: 'og:description', content: 'Histórico de sessões e evolução das cargas.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(studentOptions()), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { const { data:d } = useSuspenseQuery(studentOptions()); return <><PageHeader title="Minha evolução" /><Performance studentId={d.student.id} /></>; }
