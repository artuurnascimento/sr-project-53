-- Criar bucket para armazenar fotos faciais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'facial-references', 
  'facial-references', 
  false, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Políticas de acesso ao bucket facial-references
CREATE POLICY "Users can upload their own facial reference" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own facial reference" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own facial reference" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own facial reference" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins podem acessar todas as fotos faciais
CREATE POLICY "Admins can manage all facial references" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'facial-references' 
  AND get_current_user_role() = 'admin'
);

-- Função para comparar embeddings faciais (distância euclidiana)
CREATE OR REPLACE FUNCTION public.compare_face_embeddings(
  embedding1 vector,
  embedding2 vector,
  threshold float DEFAULT 0.6
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Função para buscar usuário por reconhecimento facial
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