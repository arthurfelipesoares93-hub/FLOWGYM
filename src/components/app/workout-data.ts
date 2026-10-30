import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Exercise = Tables<"workout_exercises">;
export type Session = Tables<"workout_sessions"> & { exercises: Exercise[] };
export type FullVersion = Tables<"workout_versions"> & { sessions: Session[] };

export async function fetchVersion(versionId: string): Promise<FullVersion | null> {
  const { data: v, error } = await supabase.from("workout_versions").select("*").eq("id", versionId).maybeSingle();
  if (error) throw error;
  if (!v) return null;
  const [{ data: sessions, error: e1 }, { data: exercises, error: e2 }] = await Promise.all([
    supabase.from("workout_sessions").select("*").eq("version_id", versionId).order("position"),
    supabase.from("workout_exercises").select("*").eq("version_id", versionId).order("position"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { ...v, sessions: (sessions ?? []).map((s) => ({ ...s, exercises: (exercises ?? []).filter((e) => e.session_id === s.id) })) };
}

export function useVersion(versionId: string | undefined) {
  return useQuery({ queryKey: ["version", versionId], enabled: !!versionId, queryFn: () => versionId ? fetchVersion(versionId) : null });
}

export function useStudentVersions(studentId: string | undefined) {
  return useQuery({
    queryKey: ["versions", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase.from("workout_versions").select("*").eq("student_id", studentId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
