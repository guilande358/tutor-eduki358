-- Expandir tabela user_progress com novos campos de gamificação
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_videos_watched integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS country_region text DEFAULT 'BR',
ADD COLUMN IF NOT EXISTS preferred_subjects text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS study_goals text,
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS premium_expires_at timestamp with time zone;

-- Criar tabela para salas de estudo colaborativas
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  host_user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Sala de Estudo',
  is_active boolean DEFAULT true,
  mode text DEFAULT 'estudo', -- 'estudo' ou 'casual'
  whiteboard_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para study_rooms
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

-- Políticas para study_rooms
CREATE POLICY "Usuários podem ver salas ativas" 
ON public.study_rooms 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Usuários autenticados podem criar salas" 
ON public.study_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Host pode atualizar sua sala" 
ON public.study_rooms 
FOR UPDATE 
USING (auth.uid() = host_user_id);

CREATE POLICY "Host pode deletar sua sala" 
ON public.study_rooms 
FOR DELETE 
USING (auth.uid() = host_user_id);

-- Criar tabela para participantes da sala
CREATE TABLE IF NOT EXISTS public.room_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  is_tutor_active boolean DEFAULT false,
  UNIQUE(room_id, user_id)
);

-- Habilitar RLS para room_participants
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para room_participants
CREATE POLICY "Participantes podem ver membros da sala" 
ON public.room_participants 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = room_participants.room_id AND rp.user_id = auth.uid()
));

CREATE POLICY "Usuários podem entrar em salas" 
ON public.room_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem sair de salas" 
ON public.room_participants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Criar tabela para mensagens da sala
CREATE TABLE IF NOT EXISTS public.room_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text', -- 'text', 'image', 'latex'
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para room_messages
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para room_messages
CREATE POLICY "Participantes podem ver mensagens" 
ON public.room_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = room_messages.room_id AND rp.user_id = auth.uid()
));

CREATE POLICY "Participantes podem enviar mensagens" 
ON public.room_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.room_participants rp 
  WHERE rp.room_id = room_messages.room_id AND rp.user_id = auth.uid()
));

-- Criar tabela para loja de recompensas
CREATE TABLE IF NOT EXISTS public.reward_shop (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text,
  xp_cost integer NOT NULL,
  reward_type text NOT NULL, -- 'theme', 'life', 'hint', 'badge'
  reward_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para reward_shop
ALTER TABLE public.reward_shop ENABLE ROW LEVEL SECURITY;

-- Política para reward_shop (todos podem ver)
CREATE POLICY "Todos podem ver a loja" 
ON public.reward_shop 
FOR SELECT 
USING (is_active = true);

-- Criar tabela para recompensas do usuário
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reward_type text NOT NULL,
  reward_id uuid REFERENCES public.reward_shop(id),
  purchased_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Habilitar RLS para user_rewards
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Políticas para user_rewards
CREATE POLICY "Usuários podem ver suas recompensas" 
ON public.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem comprar recompensas" 
ON public.user_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas recompensas" 
ON public.user_rewards 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Criar tabela para desafios diários
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  challenge_data jsonb NOT NULL,
  is_completed boolean DEFAULT false,
  xp_reward integer DEFAULT 100,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Habilitar RLS para daily_challenges
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Políticas para daily_challenges
CREATE POLICY "Usuários podem ver seus desafios" 
ON public.daily_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus desafios" 
ON public.daily_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus desafios" 
ON public.daily_challenges 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Habilitar Realtime para salas de estudo
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

-- Inserir itens iniciais na loja
INSERT INTO public.reward_shop (name, description, icon, xp_cost, reward_type, reward_data) VALUES
  ('Tema Escuro Premium', 'Tema escuro com detalhes dourados', '🌙', 500, 'theme', '{"theme": "dark-gold"}'),
  ('Tema Natureza', 'Tema verde inspirado na natureza', '🌿', 500, 'theme', '{"theme": "nature"}'),
  ('Tema Oceano', 'Tema azul profundo do oceano', '🌊', 500, 'theme', '{"theme": "ocean"}'),
  ('+1 Vida Extra', 'Recupere uma vida instantaneamente', '❤️', 100, 'life', '{"lives": 1}'),
  ('+3 Vidas Extras', 'Pacote de 3 vidas', '💖', 250, 'life', '{"lives": 3}'),
  ('Dica Premium', 'Receba uma dica detalhada do tutor', '💡', 50, 'hint', '{"hints": 1}'),
  ('Pacote de Dicas', '5 dicas premium', '🧠', 200, 'hint', '{"hints": 5}')
ON CONFLICT DO NOTHING;