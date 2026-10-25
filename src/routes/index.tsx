import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, Dumbbell, ShieldCheck, Wallet, Sparkles, LineChart } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forja — Treinos com IA aprovados pelo seu treinador" },
      { name: "description", content: "Ficha de avaliação, treinos gerados por IA com aprovação do treinador, acompanhamento de cargas e controle de mensalidades." },
      { property: "og:title", content: "Forja — Gestão de alunos e treinos" },
      { property: "og:description", content: "Treinos personalizados com IA, sempre revisados pelo treinador, e mensalidades sob controle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ClipboardCheck, t: "Ficha completa", d: "Avaliação em etapas com objetivos, saúde e disponibilidade." },
  { icon: Sparkles, t: "Treinos com IA", d: "Propostas individualizadas a partir da ficha do aluno." },
  { icon: ShieldCheck, t: "Aprovação obrigatória", d: "Nenhum treino chega ao aluno sem o aval do treinador." },
  { icon: Dumbbell, t: "Registro de sessões", d: "Cargas, séries e repetições salvas a cada treino." },
  { icon: LineChart, t: "Evolução", d: "Frequência semanal e progressão de cargas por período." },
  { icon: Wallet, t: "Mensalidades", d: "Cobranças, comprovantes e bloqueio automático por atraso." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <img src={hero} alt="Treinador acompanhando aluna no levantamento terra" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar/80 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 py-6">
          <nav className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold uppercase tracking-wider">For<span className="text-accent">ja</span></span>
            <Button asChild variant="secondary" size="sm"><Link to="/auth">Entrar</Link></Button>
          </nav>
          <div className="max-w-xl py-20 sm:py-28">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Plataforma para treinadores</p>
            <h1 className="text-5xl font-bold uppercase leading-[0.95] sm:text-7xl">Treino certo. Aluno em dia.</h1>
            <p className="mt-5 text-base text-primary-foreground/80 sm:text-lg">
              Fichas de avaliação, treinos criados com inteligência artificial e aprovados por você, acompanhamento de desempenho e mensalidades — em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/auth" search={{ mode: "signup" }}>Criar conta de aluno</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><Link to="/auth">Já tenho conta</Link></Button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.t} className="rounded-xl border bg-card p-5 shadow-card">
            <f.icon className="h-6 w-6 text-success" />
            <h3 className="mt-3 text-xl font-semibold uppercase">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">Dados tratados conforme a LGPD. Fotografias armazenadas de forma privada.</footer>
    </div>
  );
}
