-- Corrigir função para adicionar search_path correto
CREATE OR REPLACE FUNCTION create_daily_goal_if_not_exists(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_goals (user_id, goal_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, goal_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;