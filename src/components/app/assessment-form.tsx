import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, Section, PageHeader } from './ui-bits';
import { goalOptions, weekDays, todayISO } from '@/lib/format';
import { useAction, check } from './actions';
import type { StudentData } from '@/lib/portal';

export function AssessmentForm({ d }: { d: StudentData }) {
  const [form, setForm] = useState<TablesInsert<'assessments'>>({ ...d.assessment, student_id: d.student.id, full_name: d.assessment?.full_name || d.profile.full_name, goals: d.assessment?.goals ?? [], available_days: d.assessment?.available_days ?? [] });
  const action = useAction();
  function text(key: keyof TablesInsert<'assessments'>, label: string, type = 'text', required = false) {
    return <Field key={key} label={label}><Input type={type} required={required} max={type === 'date' ? todayISO() : undefined} value={String(form[key] ?? '')} onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? (e.target.value ? Number(e.target.value) : null) : (e.target.value || null) }))} /></Field>;
  }
  const areas: [keyof TablesInsert<'assessments'>, string][] = [['injuries','Lesões'],['current_pain','Dores atuais'],['movement_limitations','Limitações de movimento'],['medical_restrictions','Restrições médicas'],['other_notes','Outras observações'],['other_activities','Outras atividades físicas'],['activities_frequency','Frequência das atividades'],['activities_duration','Duração das atividades']];
  const select = (key: keyof TablesInsert<'assessments'>, label: string, options: string[]) => <Field label={label}><select required className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={String(form[key] ?? '')} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}><option value="">Selecione</option>{options.map(x => <option key={x}>{x}</option>)}</select></Field>;
  return <form onSubmit={e => { e.preventDefault(); action.mutate(async () => { if (!d.student.data_consent_at) throw new Error('Autorize o uso dos dados na sua conta antes de enviar a ficha.'); if (!(form.goals?.length)) throw new Error('Selecione ao menos um objetivo.'); if ((form.available_days?.length ?? 0) < Number(form.days_per_week)) throw new Error('Selecione dias disponíveis suficientes.'); check(await supabase.from('assessments').upsert({ ...form, submitted_at: new Date().toISOString() }, { onConflict: 'student_id' })); }); }} className="max-w-4xl space-y-4">
    <PageHeader title="Minha avaliação" description={d.assessment?.submitted_at ? 'Ficha enviada. Você pode atualizar suas informações.' : 'Sua ficha de avaliação'} />
    <Section title="Dados pessoais"><div className="grid gap-4 sm:grid-cols-2">{text('full_name','Nome completo','text',true)}{text('birth_date','Data de nascimento','date',true)}{text('height_cm','Altura (cm)','number',true)}{text('weight_kg','Peso atual (kg)','number',true)}</div></Section>
    <Section title="Objetivos e experiência"><div className="grid gap-3 sm:grid-cols-2">{goalOptions.map(([value,label]) => <label key={value} className="flex items-center gap-2 text-sm"><Checkbox checked={form.goals?.includes(value) ?? false} onCheckedChange={v => setForm(p => ({ ...p, goals: v ? [...(p.goals ?? []),value] : (p.goals ?? []).filter(x => x !== value) }))} />{label}</label>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-2">{text('goal_other','Outro objetivo')}{select('experience_level','Nível de experiência',['Iniciante','Intermediário','Avançado'])}{text('experience_time','Há quanto tempo você treina?')}</div></Section>
    <Section title="Disponibilidade"><div className="grid gap-4 sm:grid-cols-2"><Field label="Dias por semana"><Input type="number" required min={1} max={7} value={form.days_per_week ?? ''} onChange={e => setForm(p => ({ ...p, days_per_week: Number(e.target.value) }))} /></Field><Field label="Tempo por sessão (minutos)"><Input type="number" required min={10} max={240} value={form.session_minutes ?? ''} onChange={e => setForm(p => ({ ...p, session_minutes: Number(e.target.value) }))} /></Field>{select('training_location','Local de treino',['Academia','Casa','Ao ar livre'])}{text('equipment','Equipamentos disponíveis')}</div><div className="mt-4 flex flex-wrap gap-4">{weekDays.map(day => <label key={day} className="flex items-center gap-2 text-sm"><Checkbox checked={form.available_days?.includes(day) ?? false} onCheckedChange={v => setForm(p => ({ ...p, available_days: v ? [...(p.available_days ?? []),day] : (p.available_days ?? []).filter(x => x !== day) }))} />{day}</label>)}</div></Section>
    <Section title="Saúde e atividades adicionais"><div className="grid gap-4 sm:grid-cols-2">{areas.map(([key,label]) => <Field key={key} label={label}><Textarea value={String(form[key] ?? '')} onChange={e => setForm(p => ({ ...p, [key]: e.target.value || null }))} /></Field>)}</div></Section>
    <div className="flex flex-wrap gap-3"><Button disabled={action.isPending} type="submit">{action.isPending ? 'Enviando...' : 'Enviar avaliação'}</Button><Button disabled={action.isPending} type="button" variant="outline" onClick={() => action.mutate(async () => { check(await supabase.from('assessments').upsert(form, { onConflict: 'student_id' })); })}>Salvar rascunho</Button></div>
  </form>;
}