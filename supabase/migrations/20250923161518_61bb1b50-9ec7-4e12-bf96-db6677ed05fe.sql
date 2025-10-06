-- Criar tabela para múltiplas imagens de referência facial por usuário
CREATE TABLE public.facial_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  embedding VECTOR(512),
  quality_score NUMERIC(3,2) DEFAULT 0.0,
  is_primary BOOLEAN DEFAULT false,
  image_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para configurações do sistema de reconhecimento facial
CREATE TABLE public.facial_recognition_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  similarity_threshold NUMERIC(3,2) DEFAULT 0.80,
  liveness_required BOOLEAN DEFAULT true,
  max_images_per_user INTEGER DEFAULT 5,
  require_manual_approval BOOLEAN DEFAULT false,
  min_confidence_score NUMERIC(3,2) DEFAULT 0.75,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para auditoria de tentativas de reconhecimento
CREATE TABLE public.facial_recognition_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID,
  attempt_image_url TEXT NOT NULL,
  recognition_result JSONB NOT NULL,
  confidence_score NUMERIC(5,4),
  liveness_passed BOOLEAN DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  time_entry_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.facial_recognition_config (
  similarity_threshold,
  liveness_required,
  max_images_per_user,
  require_manual_approval,
  min_confidence_score
) VALUES (0.80, true, 5, false, 0.75);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.facial_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facial_recognition_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facial_recognition_audit ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para facial_references
CREATE POLICY "Users can view their own facial references" 
ON public.facial_references 
FOR SELECT 
USING (profile_id = get_current_user_profile_id());

CREATE POLICY "Users can create their own facial references" 
ON public.facial_references 
FOR INSERT 
WITH CHECK (profile_id = get_current_user_profile_id());

CREATE POLICY "Users can update their own facial references" 
ON public.facial_references 
FOR UPDATE 
USING (profile_id = get_current_user_profile_id());

CREATE POLICY "Admins can manage all facial references" 
ON public.facial_references 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Políticas RLS para facial_recognition_config
CREATE POLICY "Admins can manage facial recognition config" 
ON public.facial_recognition_config 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "All users can read facial recognition config" 
ON public.facial_recognition_config 
FOR SELECT 
USING (true);

-- Políticas RLS para facial_recognition_audit
CREATE POLICY "Users can view their own audit records" 
ON public.facial_recognition_audit 
FOR SELECT 
USING (profile_id = get_current_user_profile_id());

CREATE POLICY "Admins can view all audit records" 
ON public.facial_recognition_audit 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "System can create audit records" 
ON public.facial_recognition_audit 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update audit records" 
ON public.facial_recognition_audit 
FOR UPDATE 
USING (get_current_user_role() = 'admin');

-- Criar função para buscar usuário por múltiplas referências faciais
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
SET search_path TO 'public'
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

-- Criar buckets de storage para auditoria
INSERT INTO storage.buckets (id, name, public) 
VALUES ('facial-audit', 'facial-audit', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para auditoria facial
CREATE POLICY "Users can upload their audit images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'facial-audit' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can access all audit images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'facial-audit' AND get_current_user_role() = 'admin');

CREATE POLICY "Users can access their own audit images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'facial-audit' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers para atualizar timestamps
CREATE TRIGGER update_facial_references_updated_at
BEFORE UPDATE ON public.facial_references
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facial_recognition_config_updated_at
BEFORE UPDATE ON public.facial_recognition_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();