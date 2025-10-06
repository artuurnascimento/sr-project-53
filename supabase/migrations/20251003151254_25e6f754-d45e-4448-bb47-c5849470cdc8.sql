-- Limpar embeddings antigos antes de ajustar dimensões
UPDATE public.profiles SET face_embedding = NULL WHERE face_embedding IS NOT NULL;
UPDATE public.facial_references SET embedding = NULL WHERE embedding IS NOT NULL;

-- Agora ajustar dimensões dos vetores para 128 (face-api.js)
ALTER TABLE public.profiles 
ALTER COLUMN face_embedding TYPE vector(128);

ALTER TABLE public.facial_references 
ALTER COLUMN embedding TYPE vector(128);