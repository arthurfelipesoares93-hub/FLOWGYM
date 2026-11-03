import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  userId: string;
  email: string | null;
  fullName: string;
  role: "admin" | "student";
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
        supabase.from("profiles").select("full_name").eq("id", u.user.id).maybeSingle(),
      ]);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      return {
        userId: u.user.id,
        email: u.user.email ?? null,
        fullName: profile?.full_name ?? "",
        role: isAdmin ? "admin" : "student",
      };
    },
    staleTime: 60_000,
  });
}

export type AccessStatus = {
  student_id: string;
  status: string;
  has_access: boolean;
  manual_block: boolean;
  manual_block_reason: string | null;
  linked: boolean;
  photo_consent: boolean;
  data_consent: boolean;
};

export function useMyAccess() {
  return useQuery({
    queryKey: ["my-access"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_access_status");
      if (error) throw error;
      return data as unknown as AccessStatus | null;
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}
