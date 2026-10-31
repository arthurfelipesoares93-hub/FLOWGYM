import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Enums } from '@/integrations/supabase/types';
import type { StudentData } from '@/lib/portal';
import { generateWorkout } from '@/lib/workouts.functions';
import { todayISO, dateTimeBR } from '@/lib/format';
import { errMsg } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Section } from './ui-bits';
import { check } from './actions';

/** Trainer confirms the enrollment payment: creates plan + payment, then requests the AI workout proposal for review. */
export function EnrollmentConfirm({ d }: { d: StudentData }) {
  const qc = useQueryClient();
  const generate = useServerFn(generateWorkout);
  const a = d.assessment;
  const [fee, setFee] = useState(String(d.plan?.monthly_fee || ''));
  const [period, setPeriod] = useState<Enums<'plan_periodicity'>>(d.plan?.periodicity ?? 'mensal');
  const [paidOn, setPaidOn] = useState(todayISO());
  const [method, setMethod] = useState('Pix');
  const [busy, setBusy] = useState('');
  const receipts = useQuery({ queryKey: ['receipts', d.student.id], queryFn: async () => check(await supabase.from('payment_receipts').select('*').eq('student_id', d.student.id).order('created_at', { ascending: false })) });
  if (!a?.submitted_at) return null;

  async function openReceipt(path: string) {
    const w = window.open('', '_blank');
    const signed = await supabase.storage.from('receipts').createSignedUrl(path, 300);
    if (signed.error || !w) { w?.close(); toast.error('Não foi possível abrir o comprovante.'); return; }
    w.location.href = signed.data.signedUrl;
  }
  async function runAI() {
    setBusy('Gerando treino com IA...');
    try { await generate({ data: { studentId: d.student.id } }); toast.success('Treino sugerido pela IA criado. Revise na aba Treinos.'); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(''); await qc.invalidateQueries(); }
  }
  async function confirm() {
    if (!(Number(fee) > 0)) { toast.error('Informe o valor pago.'); return; }
    if (!window.confirm('Confirmar o pagamento e liberar o aluno?')) return;
    setBusy('Confirmando pagamento...');
    try {
      check(await supabase.rpc('confirm_enrollment', { _student_id: d.student.id, _fee: Number(fee), _periodicity: period, _paid_on: paidOn, _method: method }));
      toast.success('Pagamento confirmado. Aluno cadastrado.');
    } catch (e) { toast.error(errMsg(e)); setBusy(''); return; }
    await runAI();
  }

  const declared = a.payment_declared === 'pago' ? 'Aluno informou que já pagou' : a.payment_declared === 'nao_pago' ? 'Aluno informou que ainda não pagou' : 'Aluno não informou pagamento';
  return <Section title="Matrícula e pagamento">
    <p className="text-sm font-semibold">{a.payment_confirmed_at ? `Pagamento confirmado em ${dateTimeBR(a.payment_confirmed_at)}` : declared}</p>
    <div className="mt-3 space-y-2">{receipts.data?.map(r => <div key={r.id} className="flex items-center justify-between gap-2 border-b py-2 text-sm"><span className="break-all">{r.file_name}</span><Button size="sm" variant="outline" onClick={() => void openReceipt(r.storage_path)}>Ver comprovante</Button></div>)}{receipts.data && !receipts.data.length && <p className="text-sm text-muted-foreground">Nenhum comprovante enviado.</p>}</div>
    {!a.payment_confirmed_at ? <div className="mt-4 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Valor pago (R$)"><Input type="number" min={0} step="0.01" value={fee} onChange={e => setFee(e.target.value)} /></Field><Field label="Periodicidade"><select className="h-10 w-full rounded-md border bg-background px-3" value={period} onChange={e => setPeriod(e.target.value as Enums<'plan_periodicity'>)}>{['mensal', 'trimestral', 'semestral', 'anual'].map(p => <option key={p}>{p}</option>)}</select></Field><Field label="Data do pagamento"><Input type="date" max={todayISO()} value={paidOn} onChange={e => setPaidOn(e.target.value)} /></Field><Field label="Forma"><Input value={method} onChange={e => setMethod(e.target.value)} /></Field></div><Button className="w-full sm:w-auto" disabled={!!busy} onClick={() => void confirm()}>{busy || 'Confirmar pagamento e cadastrar aluno'}</Button><p className="text-xs text-muted-foreground">Ao confirmar, o plano e o pagamento são registrados e a IA prepara uma sugestão de treino, que só chega ao aluno após sua aprovação.</p></div>
      : !d.versions.length && <Button className="mt-4" disabled={!!busy} onClick={() => void runAI()}>{busy || 'Gerar treino com IA'}</Button>}
  </Section>;
}
