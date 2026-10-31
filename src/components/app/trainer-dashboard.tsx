import { ManagementDashboard } from './management-dashboard';
import { Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowUpRight, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { portalOptions } from '@/lib/portal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader, StatusBadge, EmptyState } from './ui-bits';
import { assessmentLabels, brl, dateBR, financialLabels, workoutLabels } from '@/lib/format';

export function TrainerDashboard() {
  const { data: p } = useSuspenseQuery(portalOptions);
  const s = p.students;
  return <div className="space-y-6"><PageHeader title="Visão geral" description={`Olá, ${p.profile?.full_name.split(' ')[0] || 'treinador'}.`} actions={<Button asChild variant="outline"><Link to="/admin/alunos"><Users className="h-4 w-4" />Todos os alunos</Link></Button>} />
    <Tabs defaultValue="hoje">
      <TabsList className="flex h-auto w-full flex-wrap justify-start">
        <TabsTrigger value="hoje">Hoje</TabsTrigger>
        <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
        <TabsTrigger value="alunos">Alunos</TabsTrigger>
        <TabsTrigger value="aniversarios">Aniversários</TabsTrigger>
        <TabsTrigger value="convite">Convite</TabsTrigger>
      </TabsList>
      <TabsContent value="hoje" className="pt-4"><ManagementDashboard view="tasks" /></TabsContent>
      <TabsContent value="indicadores" className="pt-4"><ManagementDashboard view="stats" /></TabsContent>
      <TabsContent value="alunos" className="space-y-4 pt-4"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold uppercase">Seus alunos</h2><span className="text-sm text-muted-foreground">{s.length} cadastrados</span></div><StudentList students={s.slice(0, 8)} />{s.length > 8 && <Button asChild variant="outline"><Link to="/admin/alunos">Ver todos<ArrowUpRight className="h-4 w-4" /></Link></Button>}</TabsContent>
      <TabsContent value="aniversarios" className="pt-4"><ManagementDashboard view="birthdays" /></TabsContent>
      <TabsContent value="convite" className="pt-4"><div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-accent/15 px-4 py-5"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Código de convite</p><p className="font-display text-3xl font-bold">{p.settings?.invite_code}</p><p className="mt-1 text-sm text-muted-foreground">Envie este código para o aluno se cadastrar.</p></div><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(p.settings?.invite_code ?? ''); toast.success('Código copiado.'); }}><Copy className="h-4 w-4" />Copiar código</Button></div></TabsContent>
    </Tabs>
  </div>;
}

export function StudentList({ students }: { students: Awaited<ReturnType<typeof import('@/lib/portal.functions').getPortal>>['students'] }) {
  if (!students.length) return <EmptyState title="Nenhum aluno vinculado" description="Compartilhe seu código de convite com seus alunos." />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-y bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Aluno</th><th>Ficha</th><th>Treino</th><th>Financeiro</th><th>Mensalidade</th><th>Vencimento</th><th /></tr></thead><tbody>{students.map(s => <tr key={s.student_id} className="border-b hover:bg-muted/40"><td className="p-3"><Link to="/admin/alunos/$studentId" params={{ studentId: s.student_id }} className="font-semibold hover:underline">{s.full_name}</Link><p className="text-xs text-muted-foreground">{s.email}</p></td><td><StatusBadge map={assessmentLabels} value={s.assessment_status} /></td><td><StatusBadge map={workoutLabels} value={s.workout_status} /></td><td><StatusBadge map={financialLabels} value={s.financial_status} /></td><td>{brl(s.monthly_fee)}</td><td>{dateBR(s.next_due_date)}</td><td><Button asChild variant="ghost" size="icon"><Link to="/admin/alunos/$studentId" params={{ studentId: s.student_id }} aria-label={`Abrir ${s.full_name}`}><ArrowUpRight className="h-4 w-4" /></Link></Button></td></tr>)}</tbody></table></div>;
}
