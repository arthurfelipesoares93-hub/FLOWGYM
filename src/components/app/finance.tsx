import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Enums } from '@/integrations/supabase/types';
import type { StudentData } from '@/lib/portal';
import { brl, dateBR, todayISO, paymentMethods } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, Section, EmptyState } from './ui-bits';
import { useAction, check } from './actions';

export function Finance({ d, trainer }: { d: StudentData; trainer: boolean }) {
  const action = useAction();
  const [fee, setFee] = useState(String(d.plan?.monthly_fee ?? ''));
  const [start, setStart] = useState(d.plan?.start_date ?? todayISO());
  const [end, setEnd] = useState(d.plan?.end_date ?? '');
  const [due, setDue] = useState(d.plan?.first_due_date ?? todayISO());
  const [period, setPeriod] = useState<Enums<'plan_periodicity'>>(d.plan?.periodicity ?? 'mensal');
  const [grace, setGrace] = useState(d.plan?.grace_days ?? 7);
  const [active, setActive] = useState(d.plan?.active ?? true);
  const [payCharge, setPayCharge] = useState('');
  const charge = d.charges.find(c => c.id === payCharge);
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayISO());
  const [method, setMethod] = useState('Pix');
  const [notes, setNotes] = useState('');
  const [refundId, setRefundId] = useState('');
  const [reason, setReason] = useState('');
  const [receiptPayment, setReceiptPayment] = useState('');
  const receipts = useQuery({ queryKey: ['receipts', d.student.id], queryFn: async () => check(await supabase.from('payment_receipts').select('*').eq('student_id', d.student.id).order('created_at', { ascending: false })) });
  return <div className="space-y-6">
    <Section title="Plano">{trainer ? <form className="space-y-4" onSubmit={e => { e.preventDefault(); action.mutate(async () => check(await supabase.rpc('upsert_plan', { _student_id: d.student.id, _fee: Number(fee), _start: start, _end: end || null as unknown as string, _first_due: due, _periodicity: period, _grace: grace, _active: active }))); }}>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Valor por período (R$)"><Input required min={0} step="0.01" type="number" value={fee} onChange={e => setFee(e.target.value)} /></Field><Field label="Periodicidade"><select className="h-10 w-full rounded-md border bg-background px-3" value={period} onChange={e => setPeriod(e.target.value as Enums<'plan_periodicity'>)}>{['mensal','trimestral','semestral','anual'].map(p => <option key={p}>{p}</option>)}</select></Field><Field label="Tolerância de atraso (dias)"><Input required type="number" min={0} max={60} value={grace} onChange={e => setGrace(Number(e.target.value))} /></Field><Field label="Início"><Input required type="date" value={start} onChange={e => setStart(e.target.value)} /></Field><Field label="Fim (opcional)"><Input type="date" min={start} value={end} onChange={e => setEnd(e.target.value)} /></Field><Field label="Primeiro vencimento"><Input required type="date" value={due} onChange={e => setDue(e.target.value)} /></Field></div>
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={active} onCheckedChange={v => setActive(v === true)} />Plano ativo</label><Button disabled={action.isPending}>Salvar plano</Button>
    </form> : d.plan ? <div className="grid gap-3 text-sm sm:grid-cols-3"><p><span className="block text-muted-foreground">Valor / {d.plan.periodicity}</span><b className="text-xl">{brl(d.plan.monthly_fee)}</b></p><p><span className="block text-muted-foreground">Início</span>{dateBR(d.plan.start_date)}</p><p><span className="block text-muted-foreground">Situação</span>{d.plan.active ? 'Ativo' : 'Inativo'}</p></div> : <EmptyState title="Nenhum plano cadastrado" />}</Section>
    {!trainer && <Section title="Como pagar"><p className="whitespace-pre-wrap text-sm">{d.instructions || 'Entre em contato com seu treinador para combinar o pagamento.'}</p></Section>}
    <Section title="Cobranças"><div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead className="text-xs uppercase text-muted-foreground"><tr><th className="py-2">Vencimento</th><th>Período</th><th>Valor</th><th>Situação</th>{trainer && <th />}</tr></thead><tbody>{d.charges.map(c => <tr key={c.id} className="border-t"><td className="py-3">{dateBR(c.due_date)}</td><td>{dateBR(c.period_start)} — {dateBR(c.period_end)}</td><td>{brl(c.amount)}</td><td>{c.status === 'aberta' ? 'Em aberto' : c.status === 'paga' ? 'Paga' : 'Cancelada'}</td>{trainer && <td>{c.status === 'aberta' && <Button size="sm" variant="outline" onClick={() => { setPayCharge(c.id); setAmount(String(c.amount)); }}>Registrar pagamento</Button>}</td>}</tr>)}</tbody></table></div>{!d.charges.length && <EmptyState title="Sem cobranças" />}</Section>
    {trainer && charge && <Section title="Registrar pagamento"><form className="space-y-4" onSubmit={e => { e.preventDefault(); action.mutate(async () => { check(await supabase.rpc('register_payment', { _charge_id: charge.id, _amount: Number(amount), _paid_on: paidOn, _method: method, _period_label: '', _notes: notes })); setPayCharge(''); }); }}><div className="grid gap-4 sm:grid-cols-3"><Field label="Valor recebido (R$)"><Input type="number" required min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /></Field><Field label="Data do pagamento"><Input required type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} /></Field><Field label="Forma de pagamento"><select className="h-10 w-full rounded-md border bg-background px-3" value={method} onChange={e => setMethod(e.target.value)}>{paymentMethods.map(p => <option key={p}>{p}</option>)}</select></Field></div><Field label="Observações"><Textarea value={notes} onChange={e => setNotes(e.target.value)} /></Field><div className="flex gap-2"><Button disabled={action.isPending}>Confirmar pagamento</Button><Button type="button" variant="outline" onClick={() => setPayCharge('')}>Cancelar</Button></div></form></Section>}
    <Section title="Pagamentos"><div className="space-y-3">{d.payments.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3 text-sm"><div><b>{brl(p.amount)}</b> · {p.method}<p className="text-xs text-muted-foreground">{dateBR(p.paid_on)} · {p.period_label}{p.refunded ? ' · Estornado' : ''}</p>{p.notes && <p>{p.notes}</p>}</div>{trainer && !p.refunded && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setRefundId(p.id); setReason(''); }}>Estornar</Button><Button size="sm" variant="outline" onClick={() => setReceiptPayment(p.id)}>Anexar comprovante</Button></div>}</div>)}</div>{!d.payments.length && <EmptyState title="Nenhum pagamento registrado" />}</Section>
    {refundId && <form className="space-y-3 border-l-2 border-destructive pl-4" onSubmit={e => { e.preventDefault(); action.mutate(async () => { check(await supabase.rpc('refund_payment', { _payment_id: refundId, _reason: reason })); setRefundId(''); }); }}><Field label="Motivo do estorno"><Textarea required value={reason} onChange={e => setReason(e.target.value)} /></Field><Button disabled={action.isPending} variant="destructive">Confirmar estorno</Button><Button type="button" variant="ghost" onClick={() => setRefundId('')}>Cancelar</Button></form>}
    {receiptPayment && <Field label="Comprovante (PDF ou imagem)"><Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={action.isPending} onChange={e => { const file = e.target.files?.[0]; if (!file) return; action.mutate(async () => { if (file.size > 10 * 1024 * 1024) throw new Error('O arquivo deve ter até 10 MB.'); const path = `${d.student.id}/${crypto.randomUUID()}.${file.name.split('.').pop()}`; check(await supabase.storage.from('receipts').upload(path, file)); const user = (await supabase.auth.getUser()).data.user; if (!user) throw new Error('Entre novamente.'); check(await supabase.from('payment_receipts').insert({ student_id: d.student.id, payment_id: receiptPayment, storage_path: path, file_name: file.name, uploaded_by: user.id })); setReceiptPayment(''); }); }} /></Field>}
    <Section title="Comprovantes">{receipts.data?.map(r => <div key={r.id} className="flex items-center justify-between border-b py-2 text-sm"><span className="break-all">{r.file_name}</span><Button variant="outline" size="sm" onClick={() => action.mutate(async () => { const signed = check(await supabase.storage.from('receipts').createSignedUrl(r.storage_path, 300)); window.open(signed.signedUrl, '_blank', 'noopener,noreferrer'); })}>Abrir</Button></div>)}{!receipts.data?.length && <p className="text-sm text-muted-foreground">Nenhum comprovante anexado.</p>}</Section>
  </div>;
}
