-- Corrigir função de busca para usar a tabela facial_references
CREATE OR REPLACE FUNCTION find_user_by_face_embedding(face_embedding text, similarity_threshold double precision DEFAULT 0.7)
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
        1.0 - (fr.embedding <=> face_embedding::vector) AS similarity_score
    FROM facial_references fr
    JOIN profiles p ON p.id = fr.profile_id
    WHERE fr.embedding IS NOT NULL
    AND p.is_active = true
    AND 1.0 - (fr.embedding <=> face_embedding::vector) >= similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT 1;
END;
$$;