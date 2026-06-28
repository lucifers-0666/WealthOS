-- Migration 003: Import History
-- Adds a table to track file imports and their MD5 hashes to prevent duplicates.

CREATE TABLE IF NOT EXISTS public.import_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_hash TEXT NOT NULL,
    filename TEXT,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    CONSTRAINT import_history_hash_user_unique UNIQUE(user_id, file_hash)
);

-- Enable RLS
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import history"
ON public.import_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import history"
ON public.import_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import history"
ON public.import_history FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own import history"
ON public.import_history FOR DELETE
USING (auth.uid() = user_id);
