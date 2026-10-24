
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.workout_status AS ENUM ('pendente', 'ajustes', 'reprovado', 'aprovado', 'substituido');
CREATE TYPE public.plan_periodicity AS ENUM ('mensal', 'trimestral', 'semestral', 'anual');

CREATE OR REPLACE FUNCTION public.today_br() RETURNS date LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date
$$;

-- ============ PROFILES & ROLES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============ TRAINER SETTINGS ============
CREATE TABLE public.trainer_settings (
  trainer_id uuid PRIMARY KEY,
  business_name text NOT NULL DEFAULT 'Minha Academia',
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  payment_instructions text NOT NULL DEFAULT 'Entre em contato com seu treinador para regularizar o pagamento.',
  due_soon_days int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.trainer_settings TO authenticated;
GRANT ALL ON public.trainer_settings TO service_role;
ALTER TABLE public.trainer_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer reads own settings" ON public.trainer_settings FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "trainer updates own settings" ON public.trainer_settings FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (trainer_id = auth.uid() AND due_soon_days BETWEEN 1 AND 30);

-- ============ STUDENTS ============
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  trainer_id uuid,
  manual_block boolean NOT NULL DEFAULT false,
  manual_block_reason text,
  manual_block_at timestamptz,
  photo_consent_at timestamptz,
  data_consent_at timestamptz,
  trainer_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.students(trainer_id);
GRANT SELECT ON public.students TO authenticated;
GRANT UPDATE (trainer_notes) ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.my_student_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_trainer_of(_student_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = _student_id AND s.trainer_id = auth.uid()
      AND public.has_role(auth.uid(), 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_own_student(_student_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.students s WHERE s.id = _student_id AND s.user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.can_access_student(_student_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_own_student(_student_id) OR public.is_trainer_of(_student_id)
$$;

CREATE POLICY "student reads self" ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "trainer reads students" ON public.students FOR SELECT TO authenticated
  USING (trainer_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "trainer updates notes" ON public.students FOR UPDATE TO authenticated
  USING (trainer_id = auth.uid() AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "trainer reads student profiles" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = profiles.id AND s.trainer_id = auth.uid())
         AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "student reads trainer profile" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.user_id = auth.uid() AND s.trainer_id = profiles.id));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============ AUDIT & NOTIFICATIONS ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.audit_logs(student_id, created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer reads audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND (actor_id = auth.uid() OR public.is_trainer_of(student_id)));

CREATE OR REPLACE FUNCTION public.log_audit(_student uuid, _action text, _entity text, _entity_id uuid, _details jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_logs(actor_id, student_id, action, entity, entity_id, details)
  VALUES (auth.uid(), _student, _action, _entity, _entity_id, coalesce(_details, '{}'::jsonb))
$$;
REVOKE EXECUTE ON FUNCTION public.log_audit(uuid, text, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  dedup_key text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, dedup_key)
);
CREATE INDEX ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE (read_at), DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify(_user uuid, _title text, _body text, _link text, _dedup text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications(user_id, title, body, link, dedup_key)
  SELECT _user, _title, _body, _link, _dedup WHERE _user IS NOT NULL
  ON CONFLICT (user_id, dedup_key) DO NOTHING
$$;
REVOKE EXECUTE ON FUNCTION public.notify(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- ============ ASSESSMENTS ============
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  birth_date date,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  weight_updated_at date,
  goals text[] NOT NULL DEFAULT '{}',
  goal_other text,
  experience_level text,
  experience_time text,
  days_per_week int,
  session_minutes int,
  available_days text[] NOT NULL DEFAULT '{}',
  training_location text,
  equipment text,
  injuries text,
  current_pain text,
  movement_limitations text,
  medical_restrictions text,
  other_notes text,
  other_activities text,
  activities_frequency text,
  activities_duration text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessments TO authenticated;
GRANT ALL ON public.assessments TO service_role;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student manages own assessment" ON public.assessments FOR ALL TO authenticated
  USING (public.is_own_student(student_id)) WITH CHECK (public.is_own_student(student_id));
CREATE POLICY "trainer reads assessment" ON public.assessments FOR SELECT TO authenticated USING (public.is_trainer_of(student_id));
CREATE POLICY "trainer marks reviewed" ON public.assessments FOR UPDATE TO authenticated
  USING (public.is_trainer_of(student_id)) WITH CHECK (public.is_trainer_of(student_id));

CREATE OR REPLACE FUNCTION public.assessment_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_trainer uuid; v_user uuid; v_name text;
BEGIN
  IF public.is_trainer_of(NEW.student_id) AND NOT public.is_own_student(NEW.student_id) THEN
    -- trainers may only change reviewed_at
    NEW := OLD; NEW.reviewed_at := now();
    RETURN NEW;
  END IF;
  -- students cannot set reviewed_at
  IF TG_OP = 'INSERT' THEN NEW.reviewed_at := NULL; ELSE NEW.reviewed_at := OLD.reviewed_at; END IF;
  IF NEW.weight_kg IS DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.weight_kg ELSE NULL END) THEN
    NEW.weight_updated_at := public.today_br();
  END IF;
  NEW.updated_at := now();
  SELECT trainer_id, user_id INTO v_trainer, v_user FROM public.students WHERE id = NEW.student_id;
  IF NEW.submitted_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.submitted_at IS NULL OR NEW.submitted_at <> OLD.submitted_at) THEN
    v_name := coalesce(nullif(NEW.full_name, ''), 'Um aluno');
    PERFORM public.notify(v_trainer, 'Ficha concluída', v_name || ' enviou a ficha de avaliação.', '/admin/alunos/' || NEW.student_id, NULL);
    PERFORM public.notify(v_user, 'Ficha recebida', 'Sua ficha de avaliação foi recebida pelo treinador.', '/aluno/ficha', NULL);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER assessment_guard BEFORE INSERT OR UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.assessment_guard();

-- ============ PHOTOS ============
CREATE TABLE public.body_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  taken_on date NOT NULL DEFAULT public.today_br(),
  angle text,
  notes text,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.body_photos(student_id, taken_on DESC);
GRANT SELECT, INSERT, DELETE ON public.body_photos TO authenticated;
GRANT ALL ON public.body_photos TO service_role;
ALTER TABLE public.body_photos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_photo_consent(_student_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.students WHERE id = _student_id AND photo_consent_at IS NOT NULL)
$$;

CREATE POLICY "read photos" ON public.body_photos FOR SELECT TO authenticated
  USING (public.is_own_student(student_id) OR (public.is_trainer_of(student_id) AND public.has_photo_consent(student_id)));
CREATE POLICY "student uploads photos" ON public.body_photos FOR INSERT TO authenticated
  WITH CHECK (public.is_own_student(student_id) AND public.has_photo_consent(student_id) AND uploaded_by = auth.uid()
              AND storage_path LIKE student_id::text || '/%');
CREATE POLICY "delete photos" ON public.body_photos FOR DELETE TO authenticated USING (public.can_access_student(student_id));

-- ============ PLANS & FINANCE ============
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  monthly_fee numeric(10,2) NOT NULL CHECK (monthly_fee >= 0),
  start_date date NOT NULL,
  end_date date,
  first_due_date date NOT NULL,
  periodicity public.plan_periodicity NOT NULL DEFAULT 'mensal',
  grace_days int NOT NULL DEFAULT 3 CHECK (grace_days BETWEEN 0 AND 60),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read plan" ON public.plans FOR SELECT TO authenticated USING (public.can_access_student(student_id));

CREATE TABLE public.charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'paga', 'cancelada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.charges(student_id, due_date);
GRANT SELECT ON public.charges TO authenticated;
GRANT ALL ON public.charges TO service_role;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read charges" ON public.charges FOR SELECT TO authenticated USING (public.can_access_student(student_id));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  charge_id uuid REFERENCES public.charges(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  paid_on date NOT NULL,
  method text NOT NULL,
  period_label text,
  notes text,
  refunded boolean NOT NULL DEFAULT false,
  refunded_at timestamptz,
  refund_reason text,
  recorded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payments(student_id, paid_on DESC);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read payments" ON public.payments FOR SELECT TO authenticated USING (public.can_access_student(student_id));

CREATE TABLE public.payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  storage_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  uploaded_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.payment_receipts TO authenticated;
GRANT ALL ON public.payment_receipts TO service_role;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read receipts" ON public.payment_receipts FOR SELECT TO authenticated USING (public.can_access_student(student_id));
CREATE POLICY "trainer adds receipts" ON public.payment_receipts FOR INSERT TO authenticated
  WITH CHECK (public.is_trainer_of(student_id) AND uploaded_by = auth.uid() AND storage_path LIKE student_id::text || '/%');
CREATE POLICY "trainer deletes receipts" ON public.payment_receipts FOR DELETE TO authenticated USING (public.is_trainer_of(student_id));

-- financial status (computed live, so it is always correct even when nobody is online)
CREATE OR REPLACE FUNCTION public.student_financial_status(_student_id uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.plans; s public.students; c public.charges; t date := public.today_br(); soon int;
BEGIN
  SELECT * INTO s FROM public.students WHERE id = _student_id;
  IF NOT FOUND THEN RETURN 'inativo'; END IF;
  SELECT * INTO p FROM public.plans WHERE student_id = _student_id;
  IF NOT FOUND OR NOT p.active OR (p.end_date IS NOT NULL AND p.end_date < t) THEN RETURN 'inativo'; END IF;
  IF s.manual_block THEN RETURN 'bloqueado'; END IF;
  SELECT * INTO c FROM public.charges WHERE student_id = _student_id AND status = 'aberta' ORDER BY due_date LIMIT 1;
  IF NOT FOUND THEN RETURN 'em_dia'; END IF;
  SELECT coalesce(due_soon_days, 5) INTO soon FROM public.trainer_settings WHERE trainer_id = s.trainer_id;
  soon := coalesce(soon, 5);
  IF t > c.due_date + p.grace_days THEN RETURN 'bloqueado'; END IF;
  IF t > c.due_date THEN RETURN 'atrasado'; END IF;
  IF t = c.due_date THEN RETURN 'pendente'; END IF;
  IF c.due_date - t <= soon THEN RETURN 'proximo'; END IF;
  RETURN 'em_dia';
END $$;

CREATE OR REPLACE FUNCTION public.student_has_access(_student_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.student_financial_status(_student_id) NOT IN ('bloqueado', 'inativo')
$$;

CREATE OR REPLACE FUNCTION public.period_interval(_p public.plan_periodicity) RETURNS interval
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _p WHEN 'mensal' THEN interval '1 month' WHEN 'trimestral' THEN interval '3 months'
    WHEN 'semestral' THEN interval '6 months' ELSE interval '12 months' END
$$;

CREATE OR REPLACE FUNCTION public.upsert_plan(_student_id uuid, _fee numeric, _start date, _end date, _first_due date,
  _periodicity public.plan_periodicity, _grace int, _active boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_old jsonb; v_due date; v_prev text; v_user uuid;
BEGIN
  IF NOT public.is_trainer_of(_student_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _fee IS NULL OR _fee < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  IF _grace < 0 OR _grace > 60 THEN RAISE EXCEPTION 'Tolerância deve ficar entre 0 e 60 dias'; END IF;
  v_prev := public.student_financial_status(_student_id);
  SELECT to_jsonb(p) INTO v_old FROM public.plans p WHERE student_id = _student_id;
  INSERT INTO public.plans(student_id, monthly_fee, start_date, end_date, first_due_date, periodicity, grace_days, active)
  VALUES (_student_id, _fee, _start, _end, _first_due, _periodicity, _grace, _active)
  ON CONFLICT (student_id) DO UPDATE SET monthly_fee = EXCLUDED.monthly_fee, start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date, first_due_date = EXCLUDED.first_due_date, periodicity = EXCLUDED.periodicity,
    grace_days = EXCLUDED.grace_days, active = EXCLUDED.active, updated_at = now()
  RETURNING id INTO v_id;
  -- ensure one open charge exists for active plans
  IF _active AND NOT EXISTS (SELECT 1 FROM public.charges WHERE student_id = _student_id AND status = 'aberta') THEN
    SELECT max(due_date) INTO v_due FROM public.charges WHERE student_id = _student_id AND status = 'paga';
    v_due := CASE WHEN v_due IS NULL THEN _first_due ELSE (v_due + public.period_interval(_periodicity))::date END;
    INSERT INTO public.charges(student_id, due_date, period_start, period_end, amount)
    VALUES (_student_id, v_due, v_due, (v_due + public.period_interval(_periodicity) - interval '1 day')::date, _fee);
  ELSE
    -- keep open charge amount in sync with the plan
    UPDATE public.charges SET amount = _fee WHERE student_id = _student_id AND status = 'aberta';
    IF v_old IS NOT NULL AND (v_old->>'first_due_date')::date IS DISTINCT FROM _first_due
       AND NOT EXISTS (SELECT 1 FROM public.charges WHERE student_id = _student_id AND status = 'paga') THEN
      UPDATE public.charges SET due_date = _first_due, period_start = _first_due,
        period_end = (_first_due + public.period_interval(_periodicity) - interval '1 day')::date
      WHERE student_id = _student_id AND status = 'aberta';
    END IF;
  END IF;
  PERFORM public.log_audit(_student_id, CASE WHEN v_old IS NULL THEN 'plano_criado' ELSE 'plano_alterado' END, 'plans', v_id,
    jsonb_build_object('antes', v_old, 'valor', _fee, 'vencimento', _first_due, 'tolerancia', _grace, 'ativo', _active));
  SELECT user_id INTO v_user FROM public.students WHERE id = _student_id;
  IF v_prev IN ('bloqueado','inativo') AND public.student_has_access(_student_id) THEN
    PERFORM public.notify(v_user, 'Acesso liberado', 'Seu acesso aos treinos está liberado.', '/aluno', NULL);
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.register_payment(_charge_id uuid, _amount numeric, _paid_on date, _method text,
  _period_label text, _notes text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.charges; p public.plans; v_pid uuid; v_prev text; v_user uuid; v_next date;
BEGIN
  SELECT * INTO c FROM public.charges WHERE id = _charge_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_trainer_of(c.student_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF c.status <> 'aberta' THEN RAISE EXCEPTION 'Esta cobrança não está em aberto'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Valor recebido inválido'; END IF;
  IF _method IS NULL OR length(trim(_method)) = 0 THEN RAISE EXCEPTION 'Informe a forma de pagamento'; END IF;
  v_prev := public.student_financial_status(c.student_id);
  INSERT INTO public.payments(student_id, charge_id, amount, paid_on, method, period_label, notes, recorded_by)
  VALUES (c.student_id, c.id, _amount, coalesce(_paid_on, public.today_br()), _method,
          coalesce(nullif(_period_label, ''), to_char(c.period_start, 'DD/MM/YYYY') || ' a ' || to_char(c.period_end, 'DD/MM/YYYY')),
          _notes, auth.uid())
  RETURNING id INTO v_pid;
  UPDATE public.charges SET status = 'paga' WHERE id = c.id;
  SELECT * INTO p FROM public.plans WHERE student_id = c.student_id;
  IF FOUND AND p.active THEN
    v_next := (c.due_date + public.period_interval(p.periodicity))::date;
    IF (p.end_date IS NULL OR v_next <= p.end_date)
       AND NOT EXISTS (SELECT 1 FROM public.charges WHERE student_id = c.student_id AND status = 'aberta') THEN
      INSERT INTO public.charges(student_id, due_date, period_start, period_end, amount)
      VALUES (c.student_id, v_next, v_next, (v_next + public.period_interval(p.periodicity) - interval '1 day')::date, p.monthly_fee);
    END IF;
  END IF;
  PERFORM public.log_audit(c.student_id, 'pagamento_registrado', 'payments', v_pid,
    jsonb_build_object('valor', _amount, 'data', _paid_on, 'forma', _method, 'cobranca', c.id));
  SELECT user_id INTO v_user FROM public.students WHERE id = c.student_id;
  IF v_prev IN ('bloqueado') AND public.student_has_access(c.student_id) THEN
    PERFORM public.notify(v_user, 'Pagamento registrado — acesso restaurado', 'Recebemos seu pagamento e seu acesso foi restaurado.', '/aluno/financeiro', NULL);
  ELSE
    PERFORM public.notify(v_user, 'Pagamento registrado', 'Seu pagamento de R$ ' || to_char(_amount, 'FM999G990D00') || ' foi registrado.', '/aluno/financeiro', NULL);
  END IF;
  RETURN v_pid;
END $$;

CREATE OR REPLACE FUNCTION public.refund_payment(_payment_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pay public.payments;
BEGIN
  SELECT * INTO pay FROM public.payments WHERE id = _payment_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_trainer_of(pay.student_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF pay.refunded THEN RAISE EXCEPTION 'Pagamento já estornado'; END IF;
  UPDATE public.payments SET refunded = true, refunded_at = now(), refund_reason = _reason WHERE id = pay.id;
  IF pay.charge_id IS NOT NULL THEN
    UPDATE public.charges SET status = 'aberta' WHERE id = pay.charge_id
      AND NOT EXISTS (SELECT 1 FROM public.payments WHERE charge_id = pay.charge_id AND NOT refunded);
  END IF;
  PERFORM public.log_audit(pay.student_id, 'pagamento_estornado', 'payments', pay.id, jsonb_build_object('motivo', _reason, 'valor', pay.amount));
END $$;

CREATE OR REPLACE FUNCTION public.set_manual_block(_student_id uuid, _blocked boolean, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid;
BEGIN
  IF NOT public.is_trainer_of(_student_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN RAISE EXCEPTION 'Informe o motivo'; END IF;
  UPDATE public.students SET manual_block = _blocked, manual_block_reason = _reason, manual_block_at = now()
  WHERE id = _student_id RETURNING user_id INTO v_user;
  PERFORM public.log_audit(_student_id, CASE WHEN _blocked THEN 'bloqueio_manual' ELSE 'desbloqueio_manual' END, 'students', _student_id,
    jsonb_build_object('motivo', _reason));
  IF _blocked THEN
    PERFORM public.notify(v_user, 'Acesso bloqueado', 'Seu acesso foi bloqueado pelo treinador. Motivo: ' || _reason, '/aluno', NULL);
  ELSIF public.student_has_access(_student_id) THEN
    PERFORM public.notify(v_user, 'Acesso restaurado', 'Seu acesso aos treinos foi restaurado.', '/aluno', NULL);
  END IF;
END $$;

-- ============ WORKOUTS ============
CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Treino',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.workout_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  status public.workout_status NOT NULL DEFAULT 'pendente',
  source text NOT NULL DEFAULT 'ia' CHECK (source IN ('ia', 'revisao')),
  ai_model text,
  summary text,
  weekly_split text,
  progression text,
  cautions text,
  requires_clearance boolean NOT NULL DEFAULT false,
  trainer_notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  published_at timestamptz,
  UNIQUE (workout_id, version_number)
);
CREATE INDEX ON public.workout_versions(student_id, status);
GRANT SELECT ON public.workout_versions TO authenticated;
GRANT UPDATE (summary, weekly_split, progression, cautions, trainer_notes, updated_at) ON public.workout_versions TO authenticated;
GRANT ALL ON public.workout_versions TO service_role;
ALTER TABLE public.workout_versions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.version_visible_to_student(_version_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workout_versions v
    WHERE v.id = _version_id AND v.status = 'aprovado' AND public.is_own_student(v.student_id)
      AND public.student_has_access(v.student_id))
$$;
CREATE OR REPLACE FUNCTION public.version_editable_by_trainer(_version_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workout_versions v
    WHERE v.id = _version_id AND v.status IN ('pendente', 'ajustes') AND public.is_trainer_of(v.student_id))
$$;
CREATE OR REPLACE FUNCTION public.version_trainer_can_read(_version_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workout_versions v WHERE v.id = _version_id AND public.is_trainer_of(v.student_id))
$$;

CREATE POLICY "trainer reads workouts" ON public.workouts FOR SELECT TO authenticated USING (public.is_trainer_of(student_id));
CREATE POLICY "student reads own workouts" ON public.workouts FOR SELECT TO authenticated USING (public.is_own_student(student_id));

CREATE POLICY "trainer reads versions" ON public.workout_versions FOR SELECT TO authenticated USING (public.is_trainer_of(student_id));
CREATE POLICY "student reads approved versions" ON public.workout_versions FOR SELECT TO authenticated
  USING (status = 'aprovado' AND public.is_own_student(student_id) AND public.student_has_access(student_id));
CREATE POLICY "trainer edits pending versions" ON public.workout_versions FOR UPDATE TO authenticated
  USING (status IN ('pendente', 'ajustes') AND public.is_trainer_of(student_id))
  WITH CHECK (status IN ('pendente', 'ajustes') AND public.is_trainer_of(student_id));

CREATE TABLE public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.workout_versions(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  name text NOT NULL,
  day_of_week text,
  muscle_groups text,
  notes text
);
CREATE INDEX ON public.workout_sessions(version_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read sessions" ON public.workout_sessions FOR SELECT TO authenticated
  USING (public.version_trainer_can_read(version_id) OR public.version_visible_to_student(version_id));
CREATE POLICY "trainer writes sessions" ON public.workout_sessions FOR ALL TO authenticated
  USING (public.version_editable_by_trainer(version_id)) WITH CHECK (public.version_editable_by_trainer(version_id));

CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.workout_versions(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  name text NOT NULL,
  muscle_group text,
  sets int NOT NULL DEFAULT 3 CHECK (sets BETWEEN 1 AND 20),
  reps text NOT NULL DEFAULT '10',
  rest_seconds int NOT NULL DEFAULT 60 CHECK (rest_seconds BETWEEN 0 AND 900),
  instructions text,
  alternatives text,
  notes text
);
CREATE INDEX ON public.workout_exercises(session_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read exercises" ON public.workout_exercises FOR SELECT TO authenticated
  USING (public.version_trainer_can_read(version_id) OR public.version_visible_to_student(version_id));
CREATE POLICY "trainer writes exercises" ON public.workout_exercises FOR ALL TO authenticated
  USING (public.version_editable_by_trainer(version_id)) WITH CHECK (public.version_editable_by_trainer(version_id)
    AND EXISTS (SELECT 1 FROM public.workout_sessions s WHERE s.id = session_id AND s.version_id = workout_exercises.version_id));

CREATE TABLE public.workout_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.workout_versions(id) ON DELETE CASCADE,
  action text NOT NULL,
  notes text,
  reviewer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workout_reviews TO authenticated;
GRANT ALL ON public.workout_reviews TO service_role;
ALTER TABLE public.workout_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trainer reads reviews" ON public.workout_reviews FOR SELECT TO authenticated USING (public.version_trainer_can_read(version_id));

-- Approval is ONLY possible through this function (no UPDATE privilege on status).
CREATE OR REPLACE FUNCTION public.review_workout_version(_version_id uuid, _action text, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.workout_versions; v_user uuid;
BEGIN
  SELECT * INTO v FROM public.workout_versions WHERE id = _version_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_trainer_of(v.student_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF v.status NOT IN ('pendente', 'ajustes') THEN RAISE EXCEPTION 'Esta versão não está aguardando revisão'; END IF;
  IF _action NOT IN ('aprovar', 'ajustes', 'reprovar') THEN RAISE EXCEPTION 'Ação inválida'; END IF;
  IF _action IN ('ajustes', 'reprovar') AND (_notes IS NULL OR length(trim(_notes)) = 0) THEN
    RAISE EXCEPTION 'Informe o motivo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.workout_exercises WHERE version_id = v.id) AND _action = 'aprovar' THEN
    RAISE EXCEPTION 'O treino não possui exercícios';
  END IF;
  SELECT user_id INTO v_user FROM public.students WHERE id = v.student_id;
  IF _action = 'aprovar' THEN
    UPDATE public.workout_versions SET status = 'substituido' WHERE student_id = v.student_id AND status = 'aprovado' AND id <> v.id;
    UPDATE public.workout_versions SET status = 'aprovado', reviewed_by = auth.uid(), reviewed_at = now(),
      review_notes = _notes, published_at = now() WHERE id = v.id;
    PERFORM public.notify(v_user, 'Treino aprovado', 'Seu treino foi aprovado pelo treinador.', '/aluno/treinos', NULL);
    PERFORM public.notify(v_user, 'Novo treino disponível', 'Um novo treino está disponível na sua área.', '/aluno/treinos', NULL);
  ELSE
    UPDATE public.workout_versions SET status = CASE WHEN _action = 'ajustes' THEN 'ajustes'::public.workout_status ELSE 'reprovado'::public.workout_status END,
      reviewed_by = auth.uid(), reviewed_at = now(), review_notes = _notes WHERE id = v.id;
  END IF;
  INSERT INTO public.workout_reviews(version_id, action, notes, reviewer_id) VALUES (v.id, _action, _notes, auth.uid());
  PERFORM public.log_audit(v.student_id, 'treino_' || _action, 'workout_versions', v.id, jsonb_build_object('versao', v.version_number, 'observacoes', _notes));
END $$;

-- Editing an approved (or rejected) version creates a new pending version copy.
CREATE OR REPLACE FUNCTION public.create_workout_revision(_version_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.workout_versions; v_new uuid; v_num int; s record; v_sess uuid;
BEGIN
  SELECT * INTO v FROM public.workout_versions WHERE id = _version_id;
  IF NOT FOUND OR NOT public.is_trainer_of(v.student_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT max(version_number) + 1 INTO v_num FROM public.workout_versions WHERE workout_id = v.workout_id;
  INSERT INTO public.workout_versions(workout_id, student_id, version_number, status, source, ai_model, summary, weekly_split,
    progression, cautions, requires_clearance, trainer_notes, created_by)
  VALUES (v.workout_id, v.student_id, v_num, 'pendente', 'revisao', v.ai_model, v.summary, v.weekly_split, v.progression,
    v.cautions, v.requires_clearance, v.trainer_notes, auth.uid())
  RETURNING id INTO v_new;
  FOR s IN SELECT * FROM public.workout_sessions WHERE version_id = v.id ORDER BY position LOOP
    INSERT INTO public.workout_sessions(version_id, position, name, day_of_week, muscle_groups, notes)
    VALUES (v_new, s.position, s.name, s.day_of_week, s.muscle_groups, s.notes) RETURNING id INTO v_sess;
    INSERT INTO public.workout_exercises(session_id, version_id, position, name, muscle_group, sets, reps, rest_seconds, instructions, alternatives, notes)
    SELECT v_sess, v_new, position, name, muscle_group, sets, reps, rest_seconds, instructions, alternatives, notes
    FROM public.workout_exercises WHERE session_id = s.id;
  END LOOP;
  INSERT INTO public.workout_reviews(version_id, action, notes, reviewer_id) VALUES (v_new, 'revisao_criada', 'Criada a partir da versão ' || v.version_number, auth.uid());
  PERFORM public.log_audit(v.student_id, 'treino_nova_versao', 'workout_versions', v_new, jsonb_build_object('origem', v.version_number, 'nova', v_num));
  RETURN v_new;
END $$;

CREATE OR REPLACE FUNCTION public.on_version_created() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_trainer uuid; v_name text;
BEGIN
  IF NEW.status = 'pendente' THEN
    SELECT s.trainer_id, coalesce(nullif(a.full_name, ''), p.full_name, 'Aluno') INTO v_trainer, v_name
    FROM public.students s LEFT JOIN public.assessments a ON a.student_id = s.id LEFT JOIN public.profiles p ON p.id = s.user_id
    WHERE s.id = NEW.student_id;
    PERFORM public.notify(v_trainer, 'Treino pendente de revisão', 'Versão ' || NEW.version_number || ' do treino de ' || v_name || ' aguarda aprovação.', '/admin/aprovacoes/' || NEW.id, NULL);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_version_created AFTER INSERT ON public.workout_versions FOR EACH ROW EXECUTE FUNCTION public.on_version_created();

-- ============ TRAINING LOGS ============
CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.workout_versions(id),
  session_id uuid NOT NULL REFERENCES public.workout_sessions(id),
  performed_on date NOT NULL DEFAULT public.today_br(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  notes text
);
CREATE INDEX ON public.training_sessions(student_id, performed_on DESC);
GRANT SELECT, INSERT, UPDATE ON public.training_sessions TO authenticated;
GRANT ALL ON public.training_sessions TO service_role;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read training" ON public.training_sessions FOR SELECT TO authenticated USING (public.can_access_student(student_id));
CREATE POLICY "student starts training" ON public.training_sessions FOR INSERT TO authenticated
  WITH CHECK (public.is_own_student(student_id) AND public.version_visible_to_student(version_id)
    AND EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.version_id = training_sessions.version_id)
    AND finished_at IS NULL);
CREATE POLICY "student updates open training" ON public.training_sessions FOR UPDATE TO authenticated
  USING (public.is_own_student(student_id) AND finished_at IS NULL AND public.student_has_access(student_id))
  WITH CHECK (public.is_own_student(student_id));

CREATE TABLE public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id),
  completed boolean NOT NULL DEFAULT false,
  set_details jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  performed_on date NOT NULL DEFAULT public.today_br(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_session_id, exercise_id)
);
CREATE INDEX ON public.exercise_logs(student_id, exercise_id, performed_on);
GRANT SELECT, INSERT, UPDATE ON public.exercise_logs TO authenticated;
GRANT ALL ON public.exercise_logs TO service_role;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.training_open_for_me(_ts uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.training_sessions t WHERE t.id = _ts AND t.finished_at IS NULL
    AND public.is_own_student(t.student_id) AND public.student_has_access(t.student_id))
$$;

CREATE POLICY "read logs" ON public.exercise_logs FOR SELECT TO authenticated USING (public.can_access_student(student_id));
CREATE POLICY "student logs exercises" ON public.exercise_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_own_student(student_id) AND public.training_open_for_me(training_session_id)
    AND EXISTS (SELECT 1 FROM public.training_sessions t JOIN public.workout_exercises e ON e.version_id = t.version_id
                WHERE t.id = training_session_id AND e.id = exercise_id AND t.student_id = exercise_logs.student_id));
CREATE POLICY "student edits logs" ON public.exercise_logs FOR UPDATE TO authenticated
  USING (public.is_own_student(student_id) AND public.training_open_for_me(training_session_id))
  WITH CHECK (public.is_own_student(student_id) AND public.training_open_for_me(training_session_id));

CREATE OR REPLACE FUNCTION public.on_training_finished() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_trainer uuid; v_name text; v_sess text;
BEGIN
  IF NEW.finished_at IS NOT NULL AND OLD.finished_at IS NULL THEN
    SELECT s.trainer_id, coalesce(nullif(a.full_name, ''), p.full_name, 'Aluno') INTO v_trainer, v_name
    FROM public.students s LEFT JOIN public.assessments a ON a.student_id = s.id LEFT JOIN public.profiles p ON p.id = s.user_id
    WHERE s.id = NEW.student_id;
    SELECT name INTO v_sess FROM public.workout_sessions WHERE id = NEW.session_id;
    PERFORM public.notify(v_trainer, 'Desempenho registrado', v_name || ' concluiu a sessão "' || coalesce(v_sess, '') || '".', '/admin/alunos/' || NEW.student_id, NULL);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_training_finished AFTER UPDATE ON public.training_sessions FOR EACH ROW EXECUTE FUNCTION public.on_training_finished();

-- ============ SIGNUP / LINKING ============
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_trainer uuid; v_code text;
BEGIN
  INSERT INTO public.profiles(id, full_name, email)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  -- public signup ALWAYS creates a student; admins are promoted through make_admin()
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'student');
  v_code := upper(trim(coalesce(NEW.raw_user_meta_data->>'invite_code', '')));
  IF v_code <> '' THEN SELECT trainer_id INTO v_trainer FROM public.trainer_settings WHERE invite_code = v_code; END IF;
  INSERT INTO public.students(user_id, trainer_id, data_consent_at)
  VALUES (NEW.id, v_trainer, CASE WHEN (NEW.raw_user_meta_data->>'data_consent') = 'true' THEN now() END);
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.link_trainer(_code text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_trainer uuid;
BEGIN
  SELECT trainer_id INTO v_trainer FROM public.trainer_settings WHERE invite_code = upper(trim(_code));
  IF v_trainer IS NULL THEN RAISE EXCEPTION 'Código do treinador inválido'; END IF;
  UPDATE public.students SET trainer_id = v_trainer WHERE user_id = auth.uid() AND trainer_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conta já vinculada ou inexistente'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_consents(_photo boolean, _data boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.students SET
    photo_consent_at = CASE WHEN _photo THEN coalesce(photo_consent_at, now()) ELSE NULL END,
    data_consent_at = CASE WHEN _data THEN coalesce(data_consent_at, now()) ELSE NULL END
  WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Aluno não encontrado'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_my_payment_instructions() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.payment_instructions FROM public.students s JOIN public.trainer_settings t ON t.trainer_id = s.trainer_id
  WHERE s.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.my_access_status() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('student_id', s.id, 'status', public.student_financial_status(s.id),
    'has_access', public.student_has_access(s.id), 'manual_block', s.manual_block, 'manual_block_reason', s.manual_block_reason,
    'linked', s.trainer_id IS NOT NULL, 'photo_consent', s.photo_consent_at IS NOT NULL, 'data_consent', s.data_consent_at IS NOT NULL)
  FROM public.students s WHERE s.user_id = auth.uid()
$$;

-- Admin creation: executable only by the database owner / service role.
CREATE OR REPLACE FUNCTION public.make_admin(_email text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(_email);
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;
  DELETE FROM public.user_roles WHERE user_id = v_uid AND role = 'student';
  DELETE FROM public.students WHERE user_id = v_uid;
  INSERT INTO public.user_roles(user_id, role) VALUES (v_uid, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.trainer_settings(trainer_id) VALUES (v_uid) ON CONFLICT DO NOTHING;
END $$;
REVOKE EXECUTE ON FUNCTION public.make_admin(text) FROM PUBLIC, anon, authenticated;

-- Trainer overview: one row per linked student with computed statuses
CREATE OR REPLACE FUNCTION public.trainer_students_overview()
RETURNS TABLE (student_id uuid, full_name text, email text, created_at timestamptz, financial_status text, has_access boolean,
  assessment_status text, workout_status text, next_due_date date, monthly_fee numeric, last_training date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, coalesce(nullif(a.full_name, ''), nullif(p.full_name, ''), p.email), p.email, s.created_at,
    public.student_financial_status(s.id), public.student_has_access(s.id),
    CASE WHEN a.submitted_at IS NULL THEN 'nao_enviada'
         WHEN a.reviewed_at IS NULL OR a.reviewed_at < a.updated_at - interval '1 second' THEN 'aguardando'
         ELSE 'analisada' END,
    coalesce((SELECT CASE WHEN bool_or(v.status IN ('pendente','ajustes')) THEN 'pendente'
                           WHEN bool_or(v.status = 'aprovado') THEN 'aprovado' ELSE 'sem_treino' END
              FROM public.workout_versions v WHERE v.student_id = s.id), 'sem_treino'),
    (SELECT min(c.due_date) FROM public.charges c WHERE c.student_id = s.id AND c.status = 'aberta'),
    pl.monthly_fee,
    (SELECT max(t.performed_on) FROM public.training_sessions t WHERE t.student_id = s.id)
  FROM public.students s
  JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN public.assessments a ON a.student_id = s.id
  LEFT JOIN public.plans pl ON pl.student_id = s.id
  WHERE s.trainer_id = auth.uid() AND public.has_role(auth.uid(), 'admin')
$$;

-- Daily billing notifications (dedup per charge & kind)
CREATE OR REPLACE FUNCTION public.run_daily_billing_notifications() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; st text;
BEGIN
  FOR r IN SELECT s.id sid, s.user_id, s.trainer_id, c.id cid, c.due_date,
      coalesce(nullif(a.full_name, ''), p.full_name, 'Aluno') nm
    FROM public.students s JOIN public.charges c ON c.student_id = s.id AND c.status = 'aberta'
    JOIN public.profiles p ON p.id = s.user_id LEFT JOIN public.assessments a ON a.student_id = s.id
  LOOP
    st := public.student_financial_status(r.sid);
    IF st IN ('proximo', 'pendente') THEN
      PERFORM public.notify(r.user_id, 'Mensalidade próxima do vencimento', 'Sua mensalidade vence em ' || to_char(r.due_date, 'DD/MM/YYYY') || '.', '/aluno/financeiro', 'due_soon_' || r.cid);
      PERFORM public.notify(r.trainer_id, 'Mensalidade próxima do vencimento', 'A mensalidade de ' || r.nm || ' vence em ' || to_char(r.due_date, 'DD/MM/YYYY') || '.', '/admin/alunos/' || r.sid, 'due_soon_' || r.cid);
    ELSIF st = 'atrasado' THEN
      PERFORM public.notify(r.trainer_id, 'Mensalidade atrasada', 'A mensalidade de ' || r.nm || ' venceu em ' || to_char(r.due_date, 'DD/MM/YYYY') || '.', '/admin/alunos/' || r.sid, 'late_' || r.cid);
    ELSIF st = 'bloqueado' THEN
      PERFORM public.notify(r.trainer_id, 'Mensalidade atrasada — acesso bloqueado', 'O acesso de ' || r.nm || ' foi bloqueado por atraso.', '/admin/alunos/' || r.sid, 'blocked_' || r.cid);
      PERFORM public.notify(r.user_id, 'Acesso bloqueado', 'Seu acesso foi bloqueado por mensalidade em atraso. Veja como regularizar.', '/aluno/financeiro', 'blocked_' || r.cid);
    END IF;
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.run_daily_billing_notifications() FROM PUBLIC, anon, authenticated;

-- ============ STORAGE POLICIES ============
CREATE OR REPLACE FUNCTION public.safe_uuid(_t text) RETURNS uuid LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN RETURN _t::uuid; EXCEPTION WHEN others THEN RETURN NULL; END $$;

CREATE POLICY "photos read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'body-photos' AND (
    public.is_own_student(public.safe_uuid((storage.foldername(name))[1]))
    OR (public.is_trainer_of(public.safe_uuid((storage.foldername(name))[1])) AND public.has_photo_consent(public.safe_uuid((storage.foldername(name))[1])))));
CREATE POLICY "photos upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'body-photos' AND public.is_own_student(public.safe_uuid((storage.foldername(name))[1]))
  AND public.has_photo_consent(public.safe_uuid((storage.foldername(name))[1])));
CREATE POLICY "photos delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'body-photos' AND public.can_access_student(public.safe_uuid((storage.foldername(name))[1])));

CREATE POLICY "receipts read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'receipts' AND public.can_access_student(public.safe_uuid((storage.foldername(name))[1])));
CREATE POLICY "receipts upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'receipts' AND public.is_trainer_of(public.safe_uuid((storage.foldername(name))[1])));
CREATE POLICY "receipts delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'receipts' AND public.is_trainer_of(public.safe_uuid((storage.foldername(name))[1])));
