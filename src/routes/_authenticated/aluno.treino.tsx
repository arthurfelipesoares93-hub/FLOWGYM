import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { StudentTraining } from '@/components/app/training';
export const Route = createFileRoute('/_authenticated/aluno/treino')({ staticData: { sitemap: false }, head: () => ({ meta: [{ title: 'Meu treino — Team Oliveira' }, { name: 'description', content: 'Meu treino para o acompanhamento personalizado.' }, { property: 'og:title', content: 'Meu treino — Team Oliveira' }, { property: 'og:description', content: 'Meu treino para o acompanhamento personalizado.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(studentOptions()), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { const { data:d } = useSuspenseQuery(studentOptions()); return <StudentTraining key={d.student.id + String(d.student.photo_consent_at) + String(d.student.data_consent_at)} d={d} />; }
