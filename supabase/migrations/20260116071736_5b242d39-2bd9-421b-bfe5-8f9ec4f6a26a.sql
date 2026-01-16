
-- Tabela para preferências de quiz do usuário
CREATE TABLE public.user_quiz_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  favorite_subject TEXT NOT NULL DEFAULT 'Matemática',
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  exercises_per_quiz INTEGER NOT NULL DEFAULT 5,
  question_types TEXT[] DEFAULT ARRAY['multiple_choice', 'true_false', 'fill_blank'],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela para sessões de quiz diário
CREATE TABLE public.daily_quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB DEFAULT '[]',
  score INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 5,
  is_completed BOOLEAN DEFAULT FALSE,
  xp_reward INTEGER DEFAULT 0,
  credits_reward INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quiz_date)
);

-- Tabela para preferências de UI
CREATE TABLE public.user_ui_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hide_daily_banner BOOLEAN DEFAULT FALSE,
  banner_hidden_until DATE,
  chat_mode TEXT DEFAULT 'tutor',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_quiz_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_quiz_preferences
CREATE POLICY "Users can view own quiz preferences"
ON public.user_quiz_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz preferences"
ON public.user_quiz_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz preferences"
ON public.user_quiz_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for daily_quiz_sessions
CREATE POLICY "Users can view own quiz sessions"
ON public.daily_quiz_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions"
ON public.daily_quiz_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz sessions"
ON public.daily_quiz_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_ui_preferences
CREATE POLICY "Users can view own UI preferences"
ON public.user_ui_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own UI preferences"
ON public.user_ui_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own UI preferences"
ON public.user_ui_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_quiz_preferences_updated_at
BEFORE UPDATE ON public.user_quiz_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_ui_preferences_updated_at
BEFORE UPDATE ON public.user_ui_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
