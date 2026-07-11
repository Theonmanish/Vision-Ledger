-- Migration 003: Batch Verification Support
-- Creates batches table and adds batch_id to claims for grouping

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT,
  total_images INTEGER NOT NULL DEFAULT 0,
  completed_images INTEGER NOT NULL DEFAULT 0,
  failed_images INTEGER NOT NULL DEFAULT 0,
  average_confidence DECIMAL(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add batch_id column to claims table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

-- Create index for faster batch lookups
CREATE INDEX IF NOT EXISTS idx_claims_batch_id ON claims(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_user_id ON batches(user_id);

-- Enable Row Level Security on batches
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batches
CREATE POLICY "Users can view own batches"
  ON batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batches"
  ON batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches"
  ON batches FOR UPDATE
  USING (auth.uid() = user_id);

-- Comment on columns for documentation
COMMENT ON TABLE batches IS 'Stores batch verification jobs for processing multiple images';
COMMENT ON COLUMN batches.project_name IS 'Optional user-provided name for the batch';
COMMENT ON COLUMN batches.total_images IS 'Total number of images in the batch';
COMMENT ON COLUMN batches.completed_images IS 'Number of successfully processed images';
COMMENT ON COLUMN batches.failed_images IS 'Number of images that failed processing';
COMMENT ON COLUMN batches.average_confidence IS 'Average confidence score across all completed verifications';
COMMENT ON COLUMN batches.status IS 'Batch status: processing, completed, partial, failed';
