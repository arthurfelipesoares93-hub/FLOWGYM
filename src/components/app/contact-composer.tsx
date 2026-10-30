import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Copy,MessageCircle,Check,History} from 'lucide-react';
import {toast} from 'sonner';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogTrigger} from '@/components/ui/dialog';
import {Field,Section} from './ui-bits';
import {useAction,check} from './actions';
import {whatsappUrl} from '@/lib/management-rules';
import {dateTimeBR} from '@/lib/format';
type Props={name:string;phone:string;studentId?:string;leadId?:string;type:'acompanhamento'|'financeiro'|'aniversario'|'meta'|'comercial'|'manual'|'outros';message:()=>string;label?:string;goalId?:string};
export function ContactComposer(p:Props){
 const [open,setOpen]=useState(false),[text,setText]=useState(''),[notes,setNotes]=useState(''),[id,setId]=useState<string>(),[sent,setSent]=useState(false);
 const action=useAction();
 async function save(status:'gerada'|'copiada'|'enviada'|'concluida'){
  const body={student_id:p.studentId??null,lead_id:p.leadId??null,contact_type:p.type,message:text,reason:p.label??p.type,notes,status,goal_id:p.goalId??null,birthday_year:p.type==='aniversario'?Number(new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'}).slice(0,4)):null};
  if(id){check(await supabase.from('contact_history').update(body).eq('id',id));return id;}
  const row=check(await supabase.from('contact_history').insert(body).select('id').single());setId(row.id);return row.id;
 }
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" variant="outline" onClick={()=>{try{setText(p.message());setNotes('');setId(undefined);setSent(false);setOpen(true);}catch(e){toast.error(e instanceof Error?e.message:'Revise os dados.');}}}><MessageCircle className="h-4 w-4"/>{p.label??'Gerar mensagem'}</Button></DialogTrigger><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Mensagem para {p.name}</DialogTitle></DialogHeader><Field label="Mensagem"><Textarea rows={12} maxLength={10000} value={text} onChange={e=>setText(e.target.value)}/></Field><Field label="Observação privada"><Textarea maxLength={4000} value={notes} onChange={e=>setNotes(e.target.value)}/></Field><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={action.isPending||sent} onClick={()=>action.mutate(async()=>save('gerada'))}><History className="h-4 w-4"/>Salvar preparação</Button><Button variant="outline" disabled={action.isPending} onClick={()=>action.mutate(async()=>{await navigator.clipboard.writeText(text);if(!sent)await save('copiada');})}><Copy className="h-4 w-4"/>Copiar</Button><Button variant="outline" onClick={()=>{try{window.open(whatsappUrl(p.phone,text),'_blank','noopener,noreferrer');}catch(e){toast.error(e instanceof Error?e.message:'Telefone inválido.')}}}><MessageCircle className="h-4 w-4"/>Abrir WhatsApp</Button><Button disabled={action.isPending||sent} onClick={()=>action.mutate(async()=>{await save('enviada');setSent(true);})}><Check className="h-4 w-4"/>{sent?'Envio registrado':'Marcar como enviada'}</Button></div></DialogContent></Dialog>;
}
export function ContactHistory({studentId,leadId}:{studentId?:string;leadId?:string}){
 const q=useQuery({queryKey:['contacts',studentId,leadId],queryFn:async()=>{let request=supabase.from('contact_history').select('*').order('created_at',{ascending:false});if(studentId)request=request.eq('student_id',studentId);if(leadId)request=request.eq('lead_id',leadId);return check(await request);}});
 return <Section title="Histórico de contatos">{q.data?.map(c=><div key={c.id} className="border-b py-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{c.reason||c.contact_type}</b><span className="text-xs text-muted-foreground">{dateTimeBR(c.created_at)} · {c.status}</span></div><p className="mt-2 whitespace-pre-wrap">{c.message}</p>{c.notes&&<p className="mt-2 text-muted-foreground">{c.notes}</p>}</div>)}{!q.data?.length&&<p className="text-sm text-muted-foreground">Nenhum contato registrado.</p>}</Section>;
}