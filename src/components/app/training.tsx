import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StudentData } from '@/lib/portal';
import { todayISO } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, EmptyState, Loading, ErrorBox, PageHeader } from './ui-bits';
import { fetchVersion, type Session, type FullVersion } from './workout-data';
import { WorkoutView } from './workout-view';
import { useAction, check } from './actions';

type Log = { completed: boolean; notes: string; sets: { reps: number; load: number }[] };
export function StudentTraining({ d }: { d: StudentData }) {
  const id = d.versions.find(v => v.status === 'aprovado')?.id;
  const [session, setSession] = useState('');
  const q = useQuery({ queryKey: ['version',id], enabled: !!id, queryFn: () => id ? fetchVersion(id) : null });
  if (q.isLoading) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  if (!q.data) return <><PageHeader title="Meu treino" /><EmptyState title="Nenhum treino liberado" description="Seu treino aparecerá aqui após a aprovação do treinador e a ativação do seu plano." /></>;
  const selected = q.data.sessions.find(s => s.id === session);
  return <div className="space-y-5"><PageHeader title="Meu treino" description={`Versão ${q.data.version_number}`} />{selected ? <SessionLogger key={selected.id} v={q.data} s={selected} studentId={d.student.id} onClose={() => setSession('')} /> : <WorkoutView v={q.data} actions={sid => <Button variant="secondary" onClick={() => setSession(sid)}>Registrar sessão</Button>} />}</div>;
}
function SessionLogger({ v,s,studentId,onClose }: { v: FullVersion; s: Session; studentId: string; onClose: () => void }) {
  const [date,setDate] = useState(todayISO());
  const [notes,setNotes] = useState('');
  const [logs,setLogs] = useState<Record<string,Log>>(Object.fromEntries(s.exercises.map(e => [e.id,{ completed: false, notes: '', sets: Array.from({ length:e.sets }, () => ({ reps: Number.parseInt(e.reps) || 10, load:0 })) }])));
  const action = useAction();
  const opened = useQuery({ queryKey: ['open-session',studentId,s.id], queryFn: async () => check(await supabase.from('training_sessions').select('id').eq('student_id',studentId).eq('session_id',s.id).is('finished_at',null).limit(1).maybeSingle()) });
  function update(id:string,index:number,key:'reps'|'load',value:number) { setLogs(p => { const log = p[id]; if (!log) return p; return { ...p,[id]: { ...log,sets:log.sets.map((x,i) => i === index ? { ...x,[key]:value } : x) } }; }); }
  return <form className="space-y-5" onSubmit={e => { e.preventDefault(); action.mutate(async () => { if(!Object.values(logs).some(l=>l.completed)) throw new Error('Marque ao menos um exercício realizado.'); let ts: string = (opened.data as { id?: string } | null | undefined)?.id ?? ""; if (!ts) ts = (check(await supabase.from('training_sessions').insert({ student_id:studentId,version_id:v.id,session_id:s.id,performed_on:date }).select('id').single()) as unknown as { id: string }).id; for (const ex of s.exercises) { const log = logs[ex.id]; if (!log) continue; check(await supabase.from('exercise_logs').upsert({ training_session_id:ts,student_id:studentId,exercise_id:ex.id,completed:log.completed,set_details:log.sets,notes:log.notes,performed_on:date },{ onConflict:'training_session_id,exercise_id' })); } check(await supabase.from('training_sessions').update({ finished_at:new Date().toISOString(),notes,performed_on:date }).eq('id',ts)); onClose(); }); }}>
    <div className="flex items-center justify-between"><h2 className="text-2xl font-bold uppercase">{s.name}</h2><Button type="button" variant="outline" onClick={onClose}>Voltar</Button></div><Field label="Data do treino"><Input type="date" required max={todayISO()} value={date} onChange={e => setDate(e.target.value)} /></Field>
    {s.exercises.map(ex => { const log = logs[ex.id]; if (!log) return null; return <div key={ex.id} className="rounded-lg border bg-card p-4"><label className="mb-3 flex items-center gap-2 font-semibold"><Checkbox checked={log.completed} onCheckedChange={x => setLogs(p => ({ ...p,[ex.id]:{ ...log,completed:x === true } }))} />{ex.name}</label><p className="mb-3 text-xs text-muted-foreground">{ex.sets} × {ex.reps} · Descanso {ex.rest_seconds}s · {ex.instructions}</p>{ex.video_url && <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="mb-3 block text-sm font-semibold text-primary">Assistir demonstração</a>}<div className="space-y-2">{log.sets.map((set,i) => <div key={i} className="grid grid-cols-[60px_1fr_1fr] items-end gap-3"><span className="pb-2 text-xs text-muted-foreground">Série {i+1}</span><Field label="Repetições"><Input required type="number" min={0} max={1000} value={set.reps} onChange={e => update(ex.id,i,'reps',Number(e.target.value))} /></Field><Field label="Carga (kg)"><Input required type="number" min={0} max={2000} step="0.5" value={set.load} onChange={e => update(ex.id,i,'load',Number(e.target.value))} /></Field></div>)}</div><Field label="Observações do exercício"><Textarea className="mt-2" value={log.notes} onChange={e => setLogs(p => ({ ...p,[ex.id]:{ ...log,notes:e.target.value } }))} /></Field></div>; })}
    <Field label="Observações da sessão"><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></Field><Button disabled={action.isPending || opened.isLoading}>{action.isPending ? 'Salvando...' : 'Concluir e salvar treino'}</Button>
  </form>;
}
