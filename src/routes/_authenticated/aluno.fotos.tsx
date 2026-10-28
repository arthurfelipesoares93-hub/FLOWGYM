import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { StudentPhotos } from '@/components/app/student-pages';
export const Route = createFileRoute('/_authenticated/aluno/fotos')({ head: () => ({ meta: [{ title: 'Minhas fotografias — Forja' }, { name: 'description', content: 'Minhas fotografias para o acompanhamento personalizado.' }, { property: 'og:title', content: 'Minhas fotografias — Forja' }, { property: 'og:description', content: 'Minhas fotografias para o acompanhamento personalizado.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context }) => context.queryClient.ensureQueryData(studentOptions()), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { const { data:d } = useSuspenseQuery(studentOptions()); return <StudentPhotos key={d.student.id + String(d.student.photo_consent_at) + String(d.student.data_consent_at)} d={d} />; }
