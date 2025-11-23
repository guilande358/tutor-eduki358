-- Tabela para armazenar questões erradas
CREATE TABLE IF NOT EXISTS public.wrong_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  user_answer INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para metas diárias
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_exercises INTEGER DEFAULT 5,
  completed_exercises INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  xp_reward INTEGER DEFAULT 50,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, goal_date)
);

-- Adicionar colunas de configurações ao user_progress
ALTER TABLE public.user_progress 
  ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS vibration_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS last_life_lost_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.wrong_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- Policies para wrong_answers
CREATE POLICY "Usuários podem ver suas próprias questões erradas"
  ON public.wrong_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias questões erradas"
  ON public.wrong_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias questões erradas"
  ON public.wrong_answers FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para daily_goals
CREATE POLICY "Usuários podem ver suas próprias metas"
  ON public.daily_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias metas"
  ON public.daily_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias metas"
  ON public.daily_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Função para criar meta diária automaticamente
CREATE OR REPLACE FUNCTION create_daily_goal_if_not_exists(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.daily_goals (user_id, goal_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, goal_date) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;