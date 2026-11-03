import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getManagement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = context.supabase;
    const role = await db.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || !role.data) throw new Error("Acesso exclusivo do personal.");
    const results = await Promise.all([
      db.from("crm_leads").select("*").order("created_at", { ascending: false }),
      db.from("contact_history").select("*").order("created_at", { ascending: false }),
      db.from("student_goals").select("*").order("created_at", { ascending: false }),
      db.from("progress_records").select("*").order("measured_on", { ascending: false }),
      db
        .from("students")
        .select(
          "id,user_id,created_at,last_access_at,accompaniment_status,accompaniment_started_on,manual_block,manual_block_reason",
        ),
      db.from("profiles").select("id,full_name,email,phone,birth_date"),
      db
        .from("assessments")
        .select("student_id,goals,goal_other,available_days,days_per_week,submitted_at"),
      db
        .from("training_sessions")
        .select("id,student_id,performed_on,finished_at,started_at")
        .order("performed_on", { ascending: false }),
      db.from("payments").select("*").order("paid_on", { ascending: false }),
      db.from("charges").select("*").order("due_date"),
      db.from("daily_actions").select("*"),
    ]);
    for (const r of results) if (r.error) throw new Error(r.error.message);
    const [
      leads,
      contacts,
      goals,
      progress,
      students,
      profiles,
      assessments,
      sessions,
      payments,
      charges,
      actions,
    ] = results;
    const ownStudents = (students?.data ?? []).filter((s) => s.user_id !== context.userId);
    const ids = new Set(ownStudents.map((s) => s.id));
    return {
      leads: leads?.data ?? [],
      contacts: contacts?.data ?? [],
      goals: (goals?.data ?? []).filter((g) => ids.has(g.student_id)),
      progress: (progress?.data ?? []).filter((g) => ids.has(g.student_id)),
      students: ownStudents,
      profiles: profiles?.data ?? [],
      assessments: (assessments?.data ?? []).filter((g) => ids.has(g.student_id)),
      sessions: (sessions?.data ?? []).filter((g) => ids.has(g.student_id)),
      payments: (payments?.data ?? []).filter((g) => ids.has(g.student_id)),
      charges: (charges?.data ?? []).filter((g) => ids.has(g.student_id)),
      actions: actions?.data ?? [],
    };
  });
