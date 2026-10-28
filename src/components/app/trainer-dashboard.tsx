import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowUpRight, Copy, Users, ClipboardCheck, Wallet, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { portalOptions } from '@/lib/portal';
import { Button } from '@/components/ui/button';
import { PageHeader, StatCard, StatusBadge, EmptyState } from './ui-bits';
import { assessmentLabels, brl, dateBR, financialLabels, workoutLabels } from '@/lib/format';

export function TrainerDashboard() {
  const { data: p } = useSuspenseQuery(portalOptions);
  const s = p.students;
  return <div className="space-y-7"><PageHeader title="Visão geral" description={`Olá, ${p.profile?.full_name.split(' ')[0] || 'treinador'}.`} actions={<Button asChild variant="outline"><Link to="/admin/alunos"><Users className="h-4 w-4" />Todos os alunos</Link></Button>} />
    <div className="flex flex-wrap items-center justify-between gap-4 border-y bg-accent/15 px-4 py-5"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Código de convite</p><p className="font-display text-3xl font-bold">{p.settings?.invite_code}</p></div><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(p.settings?.invite_code ?? ''); toast.success('Código copiado.'); }}><Copy className="h-4 w-4" />Copiar código</Button></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="Alunos" value={s.length} tone="accent" /><StatCard label="Fichas a analisar" value={s.filter(x => x.assessment_status === 'aguardando').length} /><StatCard label="Treinos a revisar" value={s.filter(x => x.workout_status === 'pendente').length} /><StatCard label="Mensalidades em atraso" value={s.filter(x => ['atrasado','bloqueado'].includes(x.financial_status)).length} /></div>
    <div className="flex items-center justify-between"><h2 className="text-2xl font-semibold uppercase">Seus alunos</h2><span className="text-sm text-muted-foreground">{s.length} cadastrados</span></div>
    <StudentList students={s.slice(0, 8)} />
    <div className="grid gap-4 sm:grid-cols-3">{[{ title: 'Avaliações', icon: ClipboardCheck },{ title: 'Treinos', icon: Dumbbell },{ title: 'Financeiro', icon: Wallet }].map(x => <Button key={x.title} asChild variant="outline" className="h-16 justify-start"><Link to="/admin/alunos"><x.icon className="h-5 w-5" />{x.title}<ArrowUpRight className="ml-auto h-4 w-4" /></Link></Button>)}</div>
  </div>;
}

export function StudentList({ students }: { students: Awaited<ReturnType<typeof import('@/lib/portal.functions').getPortal>>['students'] }) {
  if (!students.length) return <EmptyState title="Nenhum aluno vinculado" description="Compartilhe seu código de convite com seus alunos." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-y bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Aluno</th><th>Ficha</th><th>Treino</th><th>Financeiro</th><th>Mensalidade</th><th>Vencimento</th><th /></tr></thead><tbody>{students.map(s => <tr key={s.student_id} className="border-b hover:bg-muted/40"><td className="p-3"><Link to="/admin/alunos/$studentId" params={{ studentId: s.student_id }} className="font-semibold hover:underline">{s.full_name}</Link><p className="text-xs text-muted-foreground">{s.email}</p></td><td><StatusBadge map={assessmentLabels} value={s.assessment_status} /></td><td><StatusBadge map={workoutLabels} value={s.workout_status} /></td><td><StatusBadge map={financialLabels} value={s.financial_status} /></td><td>{brl(s.monthly_fee)}</td><td>{dateBR(s.next_due_date)}</td><td><Button asChild variant="ghost" size="icon"><Link to="/admin/alunos/$studentId" params={{ studentId: s.student_id }} aria-label={`Abrir ${s.full_name}`}><ArrowUpRight className="h-4 w-4" /></Link></Button></td></tr>)}</tbody></table></div>;
}