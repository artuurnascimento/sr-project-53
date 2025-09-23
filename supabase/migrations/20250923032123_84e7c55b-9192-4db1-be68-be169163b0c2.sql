-- Update face embedding vector dimension to match client (384)
-- This fixes error: "expected 128 dimensions, not 384"

-- Ensure the vector extension exists (no-op if already installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Alter column to vector(384)
ALTER TABLE public.profiles
  ALTER COLUMN face_embedding TYPE vector(384);

-- Recreate dependent function signatures if needed (they use generic vector, so no change)
-- Keep existing RLS and policies intact.