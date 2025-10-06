-- Corrigir search_path das funções de reconhecimento facial
CREATE OR REPLACE FUNCTION public.compare_face_embeddings(
  embedding1 vector,
  embedding2 vector,
  threshold float DEFAULT 0.6
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se algum embedding for nulo, retorna false
  IF embedding1 IS NULL OR embedding2 IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calcula a distância euclidiana entre os embeddings
  -- Retorna true se a distância for menor que o threshold (faces similares)
  RETURN (embedding1 <-> embedding2) < threshold;
END;
$$;

-- Corrigir search_path da função de busca por embedding facial
CREATE OR REPLACE FUNCTION public.find_user_by_face_embedding(
  face_embedding vector,
  similarity_threshold float DEFAULT 0.6
)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  email text,
  similarity_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    (1.0 - (p.face_embedding <-> face_embedding)) as similarity_score
  FROM profiles p
  WHERE 
    p.face_embedding IS NOT NULL
    AND p.is_active = true
    AND compare_face_embeddings(p.face_embedding, face_embedding, similarity_threshold)
  ORDER BY p.face_embedding <-> face_embedding
  LIMIT 1;
END;
$$;