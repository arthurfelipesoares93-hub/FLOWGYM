import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/app/ui-bits";
import { errMsg } from "@/lib/format";

type Search = {
  mode?: "signup" | "login" | undefined;
  code?: string | undefined;
  email?: string | undefined;
  name?: string | undefined;
  phone?: string | undefined;
};

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s["mode"] === "signup" ? "signup" : undefined,
    code: typeof s["code"] === "string" ? s["code"] : undefined,
    email: typeof s["email"] === "string" ? s["email"] : undefined,
    name: typeof s["name"] === "string" ? s["name"] : undefined,
    phone: typeof s["phone"] === "string" ? s["phone"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Team Oliveira" },
      { name: "description", content: "Acesse sua conta de aluno ou treinador." },
      { property: "og:title", content: "Entrar — Team Oliveira" },
      { property: "og:description", content: "Acesse sua conta de aluno ou treinador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const {
    mode: initial,
    code: invite,
    email: invitedEmail,
    name: invitedName,
    phone: invitedPhone,
  } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(
    initial === "signup" ? "signup" : "login",
  );
  const [email, setEmail] = useState(invitedEmail ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(invitedName ?? "");
  const [phone, setPhone] = useState(invitedPhone ?? "");
  const [code, setCode] = useState(invite ?? "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel" });
      } else if (mode === "signup") {
        if (!consent) throw new Error("É necessário aceitar o tratamento dos dados pessoais.");
        if (password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/painel",
            data: { full_name: name, phone, invite_code: code, data_consent: "true" },
          },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Enviamos um link para redefinir sua senha.");
        setMode("login");
      }
    } catch (err) {
      const m = errMsg(err);
      toast.error(m === "Invalid login credentials" ? "E-mail ou senha incorretos." : m);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-hero p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="font-display text-2xl font-bold uppercase tracking-wider">
          Team <span className="text-accent">Oliveira</span>
        </Link>
        <div>
          <h2 className="text-5xl font-bold leading-none">
            Seu treino,
            <br />
            aprovado por quem entende.
          </h2>
          <p className="mt-4 max-w-sm text-primary-foreground/70">
            Cada treino gerado com IA passa pela revisão do seu treinador antes de chegar até você.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          Seus dados são protegidos e tratados conforme a LGPD.
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 block font-display text-2xl font-bold uppercase lg:hidden">
            Team <span className="text-primary">Oliveira</span>
          </Link>
          {sent ? (
            <div className="space-y-3">
              <h1 className="text-3xl font-bold">Confirme seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmação para <b>{email}</b>. Depois de confirmar, entre com
                sua senha.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSent(false);
                  setMode("login");
                }}
              >
                Ir para o login
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h1 className="text-3xl font-bold">
                {mode === "login"
                  ? "Entrar"
                  : mode === "signup"
                    ? "Criar conta de aluno"
                    : "Recuperar senha"}
              </h1>
              {mode === "signup" && (
                <>
                  <Field label="Nome completo">
                    <Input required value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Telefone / WhatsApp">
                    <Input
                      type="tel"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </Field>
                  <Field
                    label="Código do treinador"
                    hint="Peça o código ao seu treinador. Você também pode informá-lo depois."
                  >
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Ex.: A1B2C3D4"
                    />
                  </Field>
                </>
              )}
              <Field label="E-mail">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Field>
              {mode !== "forgot" && (
                <Field label="Senha">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </Field>
              )}
              {mode === "signup" && (
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(v) => setConsent(v === true)}
                    className="mt-0.5"
                  />
                  Autorizo o armazenamento e uso dos meus dados pessoais e de saúde exclusivamente
                  para a prescrição e acompanhamento dos meus treinos, conforme a LGPD.
                </label>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? "Aguarde..."
                  : mode === "login"
                    ? "Entrar"
                    : mode === "signup"
                      ? "Criar conta"
                      : "Enviar link"}
              </Button>
              <div className="flex flex-col gap-1 text-center text-sm">
                {mode === "login" && (
                  <>
                    <button
                      type="button"
                      className="text-muted-foreground hover:underline"
                      onClick={() => setMode("forgot")}
                    >
                      Esqueci minha senha
                    </button>
                    <button
                      type="button"
                      className="font-semibold hover:underline"
                      onClick={() => setMode("signup")}
                    >
                      Não tem conta? Cadastre-se
                    </button>
                  </>
                )}
                {mode !== "login" && (
                  <button
                    type="button"
                    className="font-semibold hover:underline"
                    onClick={() => setMode("login")}
                  >
                    Já tenho conta
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
