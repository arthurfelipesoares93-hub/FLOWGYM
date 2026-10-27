import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const getPortal = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, roles, access, settings, overview] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
      supabase.rpc('my_access_status'),
      supabase.from('trainer_settings').select('*').eq('trainer_id', userId).maybeSingle(),
      supabase.rpc('trainer_students_overview'),
    ]);
    for (const r of [profile, roles, access, settings, overview]) if (r.error) throw new Error(r.error.message);
    return { profile: profile.data, admin: roles.data?.some(r => r.role === 'admin') ?? false, access: access.data, settings: settings.data, students: overview.data ?? [] };
  });

export const getStudent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { studentId?: string }) => z.object({ studentId: z.string().uuid().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const sid = data.studentId ?? (await supabase.rpc('my_student_id')).data;
    if (!sid) throw new Error('Conta de aluno não encontrada.');
    const allowed = await supabase.rpc('can_access_student', { _student_id: sid });
    if (!allowed.data) throw new Error('Acesso negado.');
    const [student, assessment, plan, charges, payments, versions, instructions] = await Promise.all([
      supabase.from('students').select('*').eq('id', sid).single(),
      supabase.from('assessments').select('*').eq('student_id', sid).maybeSingle(),
      supabase.from('plans').select('*').eq('student_id', sid).maybeSingle(),
      supabase.from('charges').select('*').eq('student_id', sid).order('due_date', { ascending: false }),
      supabase.from('payments').select('*').eq('student_id', sid).order('paid_on', { ascending: false }),
      supabase.from('workout_versions').select('*').eq('student_id', sid).order('version_number', { ascending: false }),
      supabase.rpc('get_my_payment_instructions'),
    ]);
    for (const r of [student, assessment, plan, charges, payments, versions, instructions]) if (r.error) throw new Error(r.error.message);
    if (!student.data) throw new Error('Aluno não encontrado.');
    const profile = await supabase.from('profiles').select('*').eq('id', student.data.user_id).single();
    if (profile.error) throw new Error(profile.error.message);
    return { student: student.data, profile: profile.data, assessment: assessment.data, plan: plan.data, charges: charges.data ?? [], payments: payments.data ?? [], versions: versions.data ?? [], instructions: instructions.data };
  });