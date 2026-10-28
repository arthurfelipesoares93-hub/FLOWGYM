import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { Finance } from '@/components/app/finance';
import { PageHeader } from '@/components/app/ui-bits';
export const Route = createFileRoute('/_authenticated/aluno/financeiro')({ head: () => ({ meta: [{ title: 'Meu financeiro — Forja' }, { name: 'description', content: 'Seu plano, cobranças, pagamentos e comprovantes.' }, { property: 'og:title', content: 'Meu financeiro — Forja' }, { property: 'og:description', content: 'Seu plano, cobranças, pagamentos e comprovantes.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(studentOptions()), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { const { data:d } = useSuspenseQuery(studentOptions()); return <><PageHeader title="Meu financeiro" /><Finance d={d} trainer={false} /></>; }
