import {Link} from '@tanstack/react-router';
import {Button} from '@/components/ui/button';
import {useMe} from '@/lib/auth';
export function PublicNav() {
 const {data:me}=useMe();
 return <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5"><Link to="/" className="font-display text-xl font-bold uppercase sm:text-2xl">Team <span className="text-accent">Oliveira</span></Link><div className="flex items-center gap-3"><Link to="/william" className="hidden text-sm sm:block">O personal</Link><Button asChild size="sm" variant="secondary"><Link to={me?'/painel':'/auth'}>{me?'Meu painel':'Entrar'}</Link></Button></div></nav>;
}