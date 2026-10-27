import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Seu painel — Forja" }, { name: "description", content: "Acesse seu acompanhamento na Forja." }, { property: "og:title", content: "Seu painel — Forja" }, { property: "og:description", content: "Acesse seu acompanhamento na Forja." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (error) throw new Error(error.message);
    const isAdmin = (data ?? []).some((r) => r.role === "admin");
    throw redirect({ to: isAdmin ? "/admin" : "/aluno" });
  },
});
