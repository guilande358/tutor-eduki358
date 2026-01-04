-- Tabela de assinaturas premium
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  payment_provider TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver suas assinaturas" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar assinaturas" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar assinaturas" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Tabela para rastrear anúncios assistidos (para Unity Ads analytics)
CREATE TABLE public.ad_impressions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'rewarded',
  placement_id TEXT,
  reward_type TEXT,
  reward_claimed BOOLEAN DEFAULT false,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver seus anúncios" 
ON public.ad_impressions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem registrar anúncios" 
ON public.ad_impressions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Tabela para configurações de notificação
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  daily_challenge_reminders BOOLEAN DEFAULT true,
  study_reminders BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '18:00',
  push_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver suas notificações" 
ON public.notification_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar notificações" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar notificações" 
ON public.notification_settings 
FOR UPDATE 
USING (auth.uid() = user_id);