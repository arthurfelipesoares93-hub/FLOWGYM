import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/ui-bits";
import { errMsg } from "@/lib/format";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Forja" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: "Redefinir senha — Forja" },
      { property: "og:description", content: "Defina uma nova senha para sua conta." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        className="w-full max-w-sm space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres.");
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) return toast.error(errMsg(error));
          toast.success("Senha atualizada.");
          navigate({ to: "/painel" });
          return undefined;
        }}
      >
        <h1 className="text-3xl font-bold uppercase">Nova senha</h1>
        <Field label="Nova senha"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field>
        <Button className="w-full" disabled={busy}>{busy ? "Salvando..." : "Salvar senha"}</Button>
      </form>
    </div>
  );
}
