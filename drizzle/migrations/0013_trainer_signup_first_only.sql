CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_trainer uuid; v_code text;
BEGIN
  INSERT INTO public.profiles(id, full_name, email)
  VALUES (NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  -- Cadastro de treinador: só o primeiro do sistema. Depois disso, o cadastro público cria só alunos.
  IF coalesce(NEW.raw_user_meta_data->>'account_type', '') = 'treinador' THEN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
      RAISE EXCEPTION 'Já existe um treinador cadastrado';
    END IF;
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin');
    INSERT INTO public.trainer_settings(trainer_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'student');
  v_code := upper(trim(coalesce(NEW.raw_user_meta_data->>'invite_code', '')));
  IF v_code <> '' THEN SELECT trainer_id INTO v_trainer FROM public.trainer_settings WHERE invite_code = v_code; END IF;
  INSERT INTO public.students(user_id, trainer_id, data_consent_at)
  VALUES (NEW.id, v_trainer, CASE WHEN (NEW.raw_user_meta_data->>'data_consent') = 'true' THEN now() END);
  RETURN NEW;
END $$;
