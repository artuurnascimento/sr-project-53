-- Fix ambiguous column reference in face recognition function
-- Replace the existing function with proper table prefixes

CREATE OR REPLACE FUNCTION public.find_user_by_face_embedding(
  face_embedding vector, 
  similarity_threshold double precision DEFAULT 0.6
)
RETURNS TABLE(
  profile_id uuid, 
  full_name text, 
  email text, 
  similarity_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.full_name,
    p.email,
    (1.0 - (p.face_embedding <-> find_user_by_face_embedding.face_embedding)) as similarity_score
  FROM public.profiles p
  WHERE 
    p.face_embedding IS NOT NULL
    AND p.is_active = true
    AND public.compare_face_embeddings(p.face_embedding, find_user_by_face_embedding.face_embedding, similarity_threshold)
  ORDER BY p.face_embedding <-> find_user_by_face_embedding.face_embedding
  LIMIT 1;
END;
$$;