-- Adicionar colunas de créditos à tabela user_progress
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS credits_used_this_month INTEGER DEFAULT 0;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS last_credits_reset DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS credits_received_today INTEGER DEFAULT 10;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS last_daily_credit_date DATE DEFAULT CURRENT_DATE;

-- Tabela de sinalização WebRTC para vídeo em tempo real
CREATE TABLE IF NOT EXISTS public.webrtc_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para webrtc_signals
CREATE POLICY "Participantes podem enviar sinais" ON public.webrtc_signals
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id AND
    EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = webrtc_signals.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Participantes podem receber sinais" ON public.webrtc_signals
  FOR SELECT USING (
    auth.uid() = to_user_id AND
    EXISTS (SELECT 1 FROM public.room_participants WHERE room_id = webrtc_signals.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Usuários podem deletar seus próprios sinais" ON public.webrtc_signals
  FOR DELETE USING (auth.uid() = from_user_id);

-- Habilitar Realtime para sinalização WebRTC
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_signals;