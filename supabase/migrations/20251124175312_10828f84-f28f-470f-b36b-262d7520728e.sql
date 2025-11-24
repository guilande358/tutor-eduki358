-- Add language column to user_progress table
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt';

-- Add comment
COMMENT ON COLUMN public.user_progress.language IS 'User preferred language (pt, en, es)';