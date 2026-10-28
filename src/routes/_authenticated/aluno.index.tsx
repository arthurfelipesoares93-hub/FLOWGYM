import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { StudentHome } from '@/components/app/student-pages';
export const Route = createFileRoute('/_authenticated/aluno/')({ head: () => ({ meta: [{ title: 'Meu início — Forja' }, { name: 'description', content: 'Seu acompanhamento de treino e plano.' }, { property: 'og:title', content: 'Meu início — Forja' }, { property: 'og:description', content: 'Seu acompanhamento de treino e plano.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(studentOptions()), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { const { data:d } = useSuspenseQuery(studentOptions()); const { data:p } = useSuspenseQuery(portalOptions); return <StudentHome d={d} p={p} />; }
