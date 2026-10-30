import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { portalOptions, studentOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { TrainerStudent } from '@/components/app/trainer-student';
export const Route = createFileRoute('/_authenticated/admin/alunos/$studentId')({ head: () => ({ meta: [{ title: 'Acompanhamento do aluno — Team Oliveira' }, { name: 'description', content: 'Avaliação, treinos, evolução e financeiro do aluno.' }, { property: 'og:title', content: 'Acompanhamento do aluno — Team Oliveira' }, { property: 'og:description', content: 'Avaliação, treinos, evolução e financeiro do aluno.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),loader: ({ context,params }) => context.queryClient.ensureQueryData(studentOptions(params.studentId)), errorComponent: PortalError, notFoundComponent: PortalNotFound, component: Page });
function Page() { const { studentId } = Route.useParams(); const { data:d } = useSuspenseQuery(studentOptions(studentId)); return <TrainerStudent key={d.student.id} d={d} />; }
