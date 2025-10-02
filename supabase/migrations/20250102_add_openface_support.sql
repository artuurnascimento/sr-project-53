-- Habilitar extensão pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Atualizar tabela facial_references para usar vetores
ALTER TABLE facial_references 
ADD COLUMN embedding vector(512);

-- Função para buscar por similaridade de cosseno
CREATE OR REPLACE FUNCTION find_face_by_embedding_cosine(
  query_embedding vector(512),
  similarity_threshold double precision DEFAULT 0.6
)
RETURNS TABLE (
  profile_id uuid,
  full_name text,
  email text,
  similarity_score double precision
) AS $$
BEGIN
  RETURN QUERY
    SELECT 
      fr.profile_id,
      p.full_name,
      p.email,
      1 - (fr.embedding <=> query_embedding) AS similarity_score
    FROM facial_references fr
    JOIN profiles p ON p.id = fr.profile_id
    WHERE fr.embedding IS NOT NULL
    AND p.is_active = true
    AND 1 - (fr.embedding <=> query_embedding) >= similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT 1;
END;
$$;

-- Função para registrar face com embedding
CREATE OR REPLACE FUNCTION register_face_with_embedding(
  user_id uuid,
  image_url text,
  embedding vector(512),
  quality_score double precision DEFAULT 1.0
)
RETURNS boolean AS $$
BEGIN
  INSERT INTO facial_references (
    profile_id,
    image_url,
    embedding,
    quality_score,
    is_primary,
    created_at
  ) VALUES (
    user_id,
    image_url,
    embedding,
    quality_score,
    true,
    NOW()
  );
  
  RETURN true;
END;
$$;