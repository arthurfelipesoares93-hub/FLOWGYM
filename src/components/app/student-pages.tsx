import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { deleteMyAccount } from '@/lib/workouts.functions';
import { useSignOut, type AccessStatus } from '@/lib/auth';
import type { StudentData, PortalData } from '@/lib/portal';
import { dateBR, brl, financialLabels, todayISO } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, Section, PageHeader, StatusBadge, StatCard, Confirm } from './ui-bits';
import { useAction, check } from './actions';
import { PhotoGallery } from './photo-gallery';
import { ArrowUpRight, ClipboardList, Dumbbell } from 'lucide-react';

export function StudentHome({ d,p }: { d: StudentData; p: PortalData }) {
  const access = p.access as AccessStatus | null;
  const next = d.charges.filter(c => c.status === 'aberta').sort((a,b) => a.due_date.localeCompare(b.due_date))[0];
  return <div className="space-y-6"><PageHeader title={`Olá, ${d.profile.full_name.split(' ')[0] || 'aluno'}`} /><div className="flex flex-wrap items-center justify-between gap-3 border-y bg-accent/15 px-4 py-6"><h2 className="text-3xl font-bold uppercase">Seu próximo passo</h2><Button asChild><Link to={d.assessment?.submitted_at ? '/aluno/treino' : '/aluno/ficha'}>{d.assessment?.submitted_at ? 'Ver meu treino' : 'Preencher avaliação'}<ArrowUpRight className="h-4 w-4" /></Link></Button></div>
    {!access?.linked && <Section title="Vínculo com treinador"><Button asChild variant="outline"><Link to="/aluno/conta">Informar código do treinador</Link></Button></Section>}
    <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Situação financeira" value={<StatusBadge map={financialLabels} value={access?.status} />} /><StatCard label="Próximo vencimento" value={<span className="text-xl">{dateBR(next?.due_date)}</span>} /><StatCard label="Plano" value={d.plan ? brl(d.plan.monthly_fee) : '—'} /></div>
    {!access?.has_access && <div className="border-l-4 border-warning bg-warning/10 p-4 text-sm">{access?.manual_block_reason || 'Seu acesso aos treinos depende de um plano ativo e pagamentos em dia.'}<Button asChild variant="link"><Link to="/aluno/financeiro">Ver financeiro</Link></Button></div>}
    <div className="grid gap-4 sm:grid-cols-2"><Button asChild variant="outline" className="h-20 justify-start"><Link to="/aluno/ficha"><ClipboardList />Minha avaliação<ArrowUpRight className="ml-auto h-4 w-4" /></Link></Button><Button asChild variant="outline" className="h-20 justify-start"><Link to="/aluno/treino"><Dumbbell />Meu treino<ArrowUpRight className="ml-auto h-4 w-4" /></Link></Button></div>
  </div>;
}
export function StudentAccount({ d }: { d: StudentData }) {
  const [name,setName] = useState(d.profile.full_name);
  const [code,setCode] = useState('');
  const [photo,setPhoto] = useState(!!d.student.photo_consent_at);
  const [data,setData] = useState(!!d.student.data_consent_at);
  const action = useAction();
  const deleteFn = useServerFn(deleteMyAccount);
  const signOut = useSignOut();
  return <div className="max-w-3xl space-y-5"><PageHeader title="Minha conta" /><Section title="Dados da conta"><form className="space-y-4" onSubmit={e => { e.preventDefault(); action.mutate(async () => check(await supabase.from('profiles').update({ full_name:name }).eq('id',d.profile.id))); }}><Field label="Nome completo"><Input required value={name} onChange={e => setName(e.target.value)} /></Field><Field label="E-mail"><Input readOnly value={d.profile.email ?? ''} /></Field><Button disabled={action.isPending}>Salvar nome</Button></form></Section>
    {!d.student.trainer_id && <Section title="Vincular treinador"><form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); action.mutate(async () => check(await supabase.rpc('link_trainer',{ _code:code }))); }}><Field label="Código do treinador"><Input required value={code} onChange={e => setCode(e.target.value.toUpperCase())} /></Field><Button disabled={action.isPending}>Vincular treinador</Button></form></Section>}
    <Section title="Privacidade e consentimentos"><div className="space-y-4"><label className="flex items-start gap-3 text-sm"><Checkbox checked={data} onCheckedChange={v => setData(v === true)} />Autorizo o uso dos meus dados pessoais e de saúde para prescrição e acompanhamento dos treinos.</label><label className="flex items-start gap-3 text-sm"><Checkbox checked={photo} onCheckedChange={v => setPhoto(v === true)} />Autorizo o armazenamento de fotografias corporais e o acesso do meu treinador para acompanhar minha evolução.</label><Button disabled={action.isPending} onClick={() => action.mutate(async () => check(await supabase.rpc('set_consents',{ _photo:photo,_data:data })))}>Salvar consentimentos</Button></div></Section>
    <Section title="Excluir conta"><Confirm destructive title="Excluir sua conta e seus dados?" description="Seus treinos, registros, fotografias e acesso serão removidos. Esta ação não pode ser desfeita." confirmLabel="Excluir definitivamente" trigger={<Button variant="destructive" disabled={action.isPending}>Excluir minha conta</Button>} onConfirm={() => action.mutate(async () => { await deleteFn(); await signOut(); })} /></Section>
  </div>;
}
export function StudentPhotos({ d }: { d: StudentData }) {
  const [date,setDate] = useState(todayISO());
  const [angle,setAngle] = useState('Frente');
  const action = useAction();
  return <div className="space-y-6"><PageHeader title="Fotografias" />{d.student.photo_consent_at ? <Section title="Enviar fotografia"><div className="grid gap-4 sm:grid-cols-3"><Field label="Data da foto"><Input type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} /></Field><Field label="Ângulo"><select className="h-10 w-full rounded-md border bg-background px-3" value={angle} onChange={e => setAngle(e.target.value)}>{['Frente','Costas','Lado esquerdo','Lado direito'].map(x => <option key={x}>{x}</option>)}</select></Field><Field label="Fotografia"><Input type="file" accept="image/jpeg,image/png,image/webp" disabled={action.isPending} onChange={e => { const file = e.target.files?.[0]; if (!file) return; action.mutate(async () => { if (file.size > 10*1024*1024) throw new Error('A fotografia deve ter até 10 MB.'); const path = `${d.student.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`; check(await supabase.storage.from('body-photos').upload(path,file)); const user = check(await supabase.auth.getUser()).user; if (!user) throw new Error('Entre novamente.'); check(await supabase.from('body_photos').insert({ student_id:d.student.id,storage_path:path,taken_on:date,angle,uploaded_by:user.id })); }); }} /></Field></div></Section> : <Section title="Consentimento necessário"><Button asChild><Link to="/aluno/conta">Revisar autorização de fotografias</Link></Button></Section>}<PhotoGallery studentId={d.student.id} canDelete /></div>;
}
