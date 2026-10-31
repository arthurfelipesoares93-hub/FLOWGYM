import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { StudentAccount } from '@/components/app/student-pages';
export const Route = createFileRoute('/_authenticated/aluno/conta')({ staticData: { sitemap: false }, head: () => ({ meta: [{ title: 'Minha conta — Team Oliveira' }, { name: 'description', content: 'Minha conta para o acompanhamento personalizado.' }, { property: 'og:title', content: 'Minha conta — Team Oliveira' }, { property: 'og:description', content: 'Minha conta para o acompanhamento personalizado.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(studentOptions()), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { const { data:d } = useSuspenseQuery(studentOptions()); return <StudentAccount key={d.student.id + String(d.student.photo_consent_at) + String(d.student.data_consent_at)} d={d} />; }
