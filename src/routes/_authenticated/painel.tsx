import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/painel")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id);
    const isAdmin = (data ?? []).some((r) => r.role === "admin");
    throw redirect({ to: isAdmin ? "/admin" : "/aluno" });
  },
});
