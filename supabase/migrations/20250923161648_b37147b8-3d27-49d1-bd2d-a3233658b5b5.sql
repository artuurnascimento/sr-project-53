-- Corrigir search_path das funções existentes para segurança
CREATE OR REPLACE FUNCTION public.find_user_by_face_embedding_advanced(
  face_embedding VECTOR(512), 
  similarity_threshold NUMERIC DEFAULT 0.80
)
RETURNS TABLE(
  profile_id UUID, 
  full_name TEXT, 
  email TEXT, 
  similarity_score NUMERIC,
  matched_reference_id UUID,
  confidence_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  best_match RECORD;
BEGIN
  -- Buscar a melhor correspondência entre todas as referências faciais
  SELECT 
    p.id as profile_id,
    p.full_name,
    p.email,
    (1.0 - (fr.embedding <-> find_user_by_face_embedding_advanced.face_embedding)) as similarity_score,
    fr.id as matched_reference_id
  INTO best_match
  FROM public.profiles p
  INNER JOIN public.facial_references fr ON fr.profile_id = p.id
  WHERE 
    fr.embedding IS NOT NULL
    AND p.is_active = true
    AND (1.0 - (fr.embedding <-> find_user_by_face_embedding_advanced.face_embedding)) >= similarity_threshold
  ORDER BY fr.embedding <-> find_user_by_face_embedding_advanced.face_embedding
  LIMIT 1;

  IF best_match.profile_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      best_match.profile_id,
      best_match.full_name,
      best_match.email,
      best_match.similarity_score,
      best_match.matched_reference_id,
      CASE 
        WHEN best_match.similarity_score >= 0.95 THEN 'very_high'
        WHEN best_match.similarity_score >= 0.85 THEN 'high'
        WHEN best_match.similarity_score >= 0.75 THEN 'medium'
        ELSE 'low'
      END as confidence_level;
  END IF;
END;
$$;