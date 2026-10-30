import {createFileRoute,Link} from '@tanstack/react-router';
import {useQuery} from '@tanstack/react-query';
import {PublicNav} from '@/components/app/public-nav';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
import {whatsappUrl} from '@/lib/management-rules';
import {pageHead} from '@/lib/seo';
import {usePublicBrand} from '@/lib/public-brand';
export const Route=createFileRoute('/contato')({head:()=>pageHead('Comece sua jornada','Entre em contato ou crie sua conta para começar seu acompanhamento no Team Oliveira.'),component:Page});
function Page(){const q=usePublicBrand();let url:string|undefined;try{if(q.data?.phone)url=whatsappUrl(q.data.phone,'Olá, William! Quero conhecer o Team Oliveira e conversar sobre meus objetivos.')}catch{}return <><header className="bg-sidebar text-primary-foreground"><PublicNav/></header><main className="mx-auto max-w-3xl px-5 py-12"><p className="text-sm font-semibold text-primary">TEAM OLIVEIRA</p><h1 className="mt-3 text-4xl font-bold uppercase">Comece sua jornada</h1><p className="mt-4 text-base text-muted-foreground">Seu objetivo é o ponto de partida. Vamos conversar sobre o seu acompanhamento?</p><div className="mt-8 flex flex-wrap gap-3">{url&&<Button asChild variant={q.data?.cta==='contato'?'default':'outline'}><a href={url} target="_blank" rel="noopener noreferrer">Conversar com William</a></Button>}<Button asChild variant={url&&q.data?.cta==='contato'?'outline':'default'}><Link to="/auth" search={{mode:'signup',code:q.data?.invite_code}}>Criar conta de aluno</Link></Button></div></main></>}