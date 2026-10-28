import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { portalOptions } from '@/lib/portal';
import { PortalError, PortalNotFound } from '@/components/app/route-feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, PageHeader } from '@/components/app/ui-bits';
import { useAction, check } from '@/components/app/actions';
import { supabase } from '@/integrations/supabase/client';
export const Route = createFileRoute('/_authenticated/admin/configuracoes')({ head: () => ({ meta: [{ title:'Configurações do treinador — Forja' },{ name:'description',content:'Nome do negócio, código de convite e instruções de pagamento.' },{ property:'og:title',content:'Configurações do treinador — Forja' },{ property:'og:description',content:'Nome do negócio, código de convite e instruções de pagamento.' },{ property:'og:type',content:'website' },{ name:'twitter:card',content:'summary_large_image' }] }), loader:({ context }) => context.queryClient.ensureQueryData(portalOptions),errorComponent:PortalError,notFoundComponent:PortalNotFound,component:Page });
function Page() {
 const { data:p } = useSuspenseQuery(portalOptions);
 const [name,setName] = useState(p.settings?.business_name ?? '');
 const [instructions,setInstructions] = useState(p.settings?.payment_instructions ?? '');
 const [days,setDays] = useState(p.settings?.due_soon_days ?? 5);
 const action = useAction();
 return <form className="max-w-2xl space-y-5" onSubmit={e => { e.preventDefault(); action.mutate(async () => { if (!p.settings) throw new Error('Configuração não encontrada.'); check(await supabase.from('trainer_settings').update({ business_name:name,payment_instructions:instructions,due_soon_days:days,updated_at:new Date().toISOString() }).eq('trainer_id',p.settings.trainer_id)); }); }}><PageHeader title="Configurações" /><Field label="Nome do negócio"><Input required value={name} onChange={e => setName(e.target.value)} /></Field><Field label="Código de convite"><Input readOnly value={p.settings?.invite_code ?? ''} /></Field><Field label="Instruções de pagamento"><Textarea rows={5} required value={instructions} onChange={e => setInstructions(e.target.value)} /></Field><Field label="Avisar antes do vencimento (dias)"><Input required type="number" min={1} max={30} value={days} onChange={e => setDays(Number(e.target.value))} /></Field><Button disabled={action.isPending}>Salvar configurações</Button></form>;
}
