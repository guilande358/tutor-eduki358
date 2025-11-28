-- Corrigir função create_daily_goal_if_not_exists para validar user_id
CREATE OR REPLACE FUNCTION public.create_daily_goal_if_not_exists(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validar que o usuário está criando meta para si mesmo
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Não é permitido criar meta diária para outro usuário';
  END IF;
  
  -- Criar meta diária se não existir
  INSERT INTO public.daily_goals (user_id, goal_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, goal_date) DO NOTHING;
END;
$$;