-- Migration 002: Add user ownership to claims table
-- This migration adds user_id and email tracking for Row Level Security

-- Add user_id column (nullable for existing records)
ALTER TABLE public.claims
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add created_by_email for display purposes
ALTER TABLE public.claims
ADD COLUMN IF NOT EXISTS created_by_email TEXT;

-- Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS claims_user_id_idx ON public.claims(user_id);

-- Enable Row Level Security
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view own claims" ON public.claims;
DROP POLICY IF EXISTS "Users can insert own claims" ON public.claims;
DROP POLICY IF EXISTS "Users can update own claims" ON public.claims;

-- Policy: Users can SELECT their own claims
CREATE POLICY "Users can view own claims"
ON public.claims
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can INSERT their own claims
CREATE POLICY "Users can insert own claims"
ON public.claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE their own claims
CREATE POLICY "Users can update own claims"
ON public.claims
FOR UPDATE
USING (auth.uid() = user_id);

-- Note: No DELETE policy as per requirements
