-- Criar bucket de comprovantes se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Comprovantes são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Sistema pode criar comprovantes" ON storage.objects;

-- Políticas de storage para comprovantes
CREATE POLICY "Comprovantes são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprovantes');

CREATE POLICY "Sistema pode criar comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comprovantes');

-- Atualizar tabela colaboradores para incluir campo envio_resumo se não existir
ALTER TABLE public.colaboradores 
ADD COLUMN IF NOT EXISTS envio_resumo text NOT NULL DEFAULT 'diario';

-- Adicionar constraint para validar valores de envio_resumo
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'colaboradores_envio_resumo_check'
  ) THEN
    ALTER TABLE public.colaboradores
    ADD CONSTRAINT colaboradores_envio_resumo_check 
    CHECK (envio_resumo IN ('diario', 'semanal', 'mensal', 'todos'));
  END IF;
END $$;

-- Atualizar tabela pontos para incluir campo comprovante_pdf e email_enviado
ALTER TABLE public.pontos 
ADD COLUMN IF NOT EXISTS comprovante_pdf text,
ADD COLUMN IF NOT EXISTS email_enviado boolean NOT NULL DEFAULT false;

-- Atualizar logs_sistema
ALTER TABLE public.logs_sistema 
ADD COLUMN IF NOT EXISTS referencia_id uuid,
ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para colaboradores
DROP TRIGGER IF EXISTS atualizar_colaboradores_updated_at ON public.colaboradores;
CREATE TRIGGER atualizar_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_updated_at();

-- Dropar views antigas se existirem
DROP VIEW IF EXISTS public.v_pontos_completo CASCADE;
DROP VIEW IF EXISTS public.v_resumo_diario CASCADE;

-- Criar view para facilitar consultas de pontos com colaborador
CREATE VIEW public.v_pontos_completo AS
SELECT 
  p.id,
  p.colaborador_id,
  p.tipo,
  p.data_hora,
  p.localizacao,
  p.comprovante_pdf,
  p.email_enviado,
  c.nome as colaborador_nome,
  c.email as colaborador_email,
  c.envio_resumo
FROM public.pontos p
INNER JOIN public.colaboradores c ON p.colaborador_id = c.id;

-- Criar view para resumo diário de pontos
CREATE VIEW public.v_resumo_diario AS
SELECT 
  colaborador_id,
  colaborador_nome,
  DATE(data_hora) as data,
  COUNT(*) as total_registros,
  SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) as entradas,
  SUM(CASE WHEN tipo = 'saida' THEN 1 ELSE 0 END) as saidas,
  SUM(CASE WHEN tipo = 'pausa' THEN 1 ELSE 0 END) as pausas,
  SUM(CASE WHEN tipo = 'retorno' THEN 1 ELSE 0 END) as retornos,
  MIN(data_hora) as primeiro_registro,
  MAX(data_hora) as ultimo_registro
FROM public.v_pontos_completo
GROUP BY colaborador_id, colaborador_nome, DATE(data_hora);

-- Função para limpar logs antigos (mais de 90 dias)
CREATE OR REPLACE FUNCTION public.limpar_logs_antigos()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  linhas_deletadas INTEGER;
BEGIN
  DELETE FROM public.logs_sistema
  WHERE criado_em < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS linhas_deletadas = ROW_COUNT;
  RETURN linhas_deletadas;
END;
$$;