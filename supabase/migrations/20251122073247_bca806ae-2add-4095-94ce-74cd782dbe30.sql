-- Criar bucket para anexos do chat
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false);

-- Políticas de acesso ao bucket
CREATE POLICY "Usuários podem fazer upload de seus próprios anexos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem ver seus próprios anexos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar seus próprios anexos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Tabela para rastrear anexos nas mensagens
CREATE TABLE public.chat_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver seus próprios anexos"
ON public.chat_attachments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios anexos"
ON public.chat_attachments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Criar índice
CREATE INDEX idx_chat_attachments_message_id ON public.chat_attachments(message_id);

-- Tabela para sugestões personalizadas
CREATE TABLE public.student_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('study', 'exercise', 'topic', 'achievement')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.student_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver suas próprias sugestões"
ON public.student_suggestions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias sugestões"
ON public.student_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias sugestões"
ON public.student_suggestions
FOR UPDATE
USING (auth.uid() = user_id);

-- Criar índices
CREATE INDEX idx_student_suggestions_user_id ON public.student_suggestions(user_id, created_at DESC);
CREATE INDEX idx_student_suggestions_completed ON public.student_suggestions(user_id, is_completed);