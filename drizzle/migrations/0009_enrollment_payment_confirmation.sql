ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS payment_declared text CHECK (payment_declared IN ('pago','nao_pago'));
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

CREATE OR REPLACE FUNCTION public.assessment_guard()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_trainer uuid; v_user uuid; v_name text;
BEGIN
  IF public.is_trainer_of(NEW.student_id) AND NOT public.is_own_student(NEW.student_id) THEN
    NEW := OLD; NEW.reviewed_at := now();
    IF current_setting('app.enrollment_confirm', true) = '1' THEN NEW.payment_confirmed_at := now(); END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN NEW.reviewed_at := NULL; NEW.payment_confirmed_at := NULL;
  ELSE NEW.reviewed_at := OLD.reviewed_at; NEW.payment_confirmed_at := OLD.payment_confirmed_at; END IF;
  IF NEW.weight_kg IS DISTINCT FROM (CASE WHEN TG_OP = 'UPDATE' THEN OLD.weight_kg ELSE NULL END) THEN
    NEW.weight_updated_at := public.today_br();
  END IF;
  NEW.updated_at := now();
  SELECT trainer_id, user_id INTO v_trainer, v_user FROM public.students WHERE id = NEW.student_id;
  IF NEW.submitted_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.submitted_at IS NULL OR NEW.submitted_at <> OLD.submitted_at) THEN
    v_name := coalesce(nullif(NEW.full_name, ''), 'Um aluno');
    PERFORM public.notify(v_trainer, 'Ficha concluída', v_name || ' enviou a ficha de avaliação' || CASE WHEN NEW.payment_declared='pago' THEN ' e informou pagamento com comprovante.' ELSE '.' END, '/admin/alunos/' || NEW.student_id, NULL);
    PERFORM public.notify(v_user, 'Ficha recebida', 'Sua ficha de avaliação foi recebida pelo treinador.', '/aluno/ficha', NULL);
  END IF;
  RETURN NEW;
END $function$;

CREATE POLICY "student adds own receipts" ON public.payment_receipts FOR INSERT TO authenticated
WITH CHECK (public.is_own_student(student_id) AND uploaded_by = auth.uid() AND payment_id IS NULL AND storage_path LIKE (student_id::text || '/%'));

CREATE POLICY "receipts student upload" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND public.is_own_student(public.safe_uuid((storage.foldername(name))[1])));

CREATE OR REPLACE FUNCTION public.confirm_enrollment(_student_id uuid, _fee numeric, _periodicity plan_periodicity, _paid_on date, _method text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_charge uuid; v_pid uuid; v_grace int;
BEGIN
  IF NOT public.is_trainer_of(_student_id) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  IF _fee IS NULL OR _fee <= 0 THEN RAISE EXCEPTION 'Informe o valor pago'; END IF;
  SELECT coalesce(suspension_days,7) INTO v_grace FROM public.trainer_settings WHERE trainer_id = auth.uid();
  PERFORM public.upsert_plan(_student_id, _fee, _paid_on, NULL, _paid_on, _periodicity, coalesce(v_grace,7), true);
  SELECT id INTO v_charge FROM public.charges WHERE student_id = _student_id AND status = 'aberta' ORDER BY due_date LIMIT 1;
  IF v_charge IS NULL THEN RAISE EXCEPTION 'Cobrança não encontrada'; END IF;
  v_pid := public.register_payment(v_charge, _fee, _paid_on, coalesce(nullif(_method,''),'Pix'), NULL, 'Pagamento confirmado na matrícula');
  UPDATE public.payment_receipts SET payment_id = v_pid WHERE student_id = _student_id AND payment_id IS NULL;
  PERFORM set_config('app.enrollment_confirm', '1', true);
  UPDATE public.assessments SET reviewed_at = now() WHERE student_id = _student_id;
  PERFORM set_config('app.enrollment_confirm', '', true);
  UPDATE public.students SET manual_block = false WHERE id = _student_id AND manual_block;
  RETURN v_pid;
END $function$;
REVOKE ALL ON FUNCTION public.confirm_enrollment(uuid, numeric, plan_periodicity, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_enrollment(uuid, numeric, plan_periodicity, date, text) TO authenticated;