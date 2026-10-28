import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StudentData } from '@/lib/portal';
import { PageHeader, Section, Field, EmptyState } from './ui-bits';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AssessmentView } from './assessment-view';
import { TrainerWorkouts } from './workout-editor';
import { Finance } from './finance';
import { Performance } from './performance';
import { PhotoGallery } from './photo-gallery';
import { useAction, check } from './actions';
import { dateTimeBR } from '@/lib/format';

export function TrainerStudent({ d }: { d: StudentData }) {
  const action = useAction();
  const [notes,setNotes] = useState(d.student.trainer_notes ?? '');
  const [reason,setReason] = useState('');
  const audit = useQuery({ queryKey:['audit',d.student.id],queryFn:async () => check(await supabase.from('audit_logs').select('*').eq('student_id',d.student.id).order('created_at',{ ascending:false }).limit(100)) });
  return <div className="space-y-5"><Button asChild variant="link" className="px-0"><Link to="/admin/alunos">← Todos os alunos</Link></Button><PageHeader title={d.profile.full_name} description={d.profile.email ?? ''} />
    <Tabs defaultValue="ficha"><TabsList className="flex h-auto flex-wrap justify-start">{[['ficha','Avaliação'],['treinos','Treinos'],['financeiro','Financeiro'],['evolucao','Evolução'],['fotos','Fotos'],['gestao','Gestão']].map(([value,label]) => <TabsTrigger key={value} value={value ?? ''}>{label}</TabsTrigger>)}</TabsList>
      <TabsContent value="ficha">{d.assessment ? <div className="space-y-4"><AssessmentView a={d.assessment} /><Button disabled={action.isPending || !d.assessment.submitted_at} onClick={() => action.mutate(async () => { if (!d.assessment) return; check(await supabase.from('assessments').update({ reviewed_at:new Date().toISOString() }).eq('id',d.assessment.id)); })}>Marcar avaliação como analisada</Button></div> : <EmptyState title="Avaliação ainda não enviada" />}</TabsContent>
      <TabsContent value="treinos"><TrainerWorkouts d={d} /></TabsContent><TabsContent value="financeiro"><Finance d={d} trainer /></TabsContent><TabsContent value="evolucao"><Performance studentId={d.student.id} /></TabsContent><TabsContent value="fotos">{d.student.photo_consent_at ? <PhotoGallery studentId={d.student.id} canDelete /> : <EmptyState title="Aluno não autorizou acesso às fotografias" />}</TabsContent>
      <TabsContent value="gestao"><div className="space-y-5"><Section title="Observações internas"><Field label="Anotações do treinador"><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></Field><Button className="mt-3" disabled={action.isPending} onClick={() => action.mutate(async () => check(await supabase.from('students').update({ trainer_notes:notes }).eq('id',d.student.id)))}>Salvar anotações</Button></Section><Section title={d.student.manual_block ? 'Acesso bloqueado manualmente' : 'Controle de acesso'}><Field label="Motivo do bloqueio ou desbloqueio"><Textarea required value={reason} onChange={e => setReason(e.target.value)} /></Field><Button className="mt-3" variant={d.student.manual_block ? 'default' : 'destructive'} disabled={action.isPending} onClick={() => action.mutate(async () => { if (!reason.trim()) throw new Error('Informe um motivo.'); check(await supabase.rpc('set_manual_block',{ _student_id:d.student.id,_blocked:!d.student.manual_block,_reason:reason })); })}>{d.student.manual_block ? 'Desbloquear acesso' : 'Bloquear acesso'}</Button></Section><Section title="Histórico de alterações">{audit.data?.map(a => <div className="border-b py-2 text-sm" key={a.id}><b>{a.action}</b><p className="text-xs text-muted-foreground">{dateTimeBR(a.created_at)}</p></div>)}</Section></div></TabsContent>
    </Tabs>
  </div>;
}
