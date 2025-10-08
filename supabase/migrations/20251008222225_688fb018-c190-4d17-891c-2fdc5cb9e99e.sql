-- Adicionar campos necessários em time_entries para comprovantes
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS comprovante_pdf text,
ADD COLUMN IF NOT EXISTS email_enviado boolean NOT NULL DEFAULT false;

-- Adicionar campo envio_resumo em profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS envio_resumo text NOT NULL DEFAULT 'diario';

-- Adicionar constraint para validar valores de envio_resumo
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_envio_resumo_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_envio_resumo_check 
    CHECK (envio_resumo IN ('diario', 'semanal', 'mensal', 'todos'));
  END IF;
END $$;

-- Criar view para facilitar consultas de pontos com perfil
DROP VIEW IF EXISTS public.v_time_entries_completo CASCADE;
CREATE VIEW public.v_time_entries_completo AS
SELECT 
  te.id,
  te.employee_id,
  te.punch_type,
  te.punch_time,
  te.location_address,
  te.location_lat,
  te.location_lng,
  te.comprovante_pdf,
  te.email_enviado,
  p.full_name as employee_name,
  p.email as employee_email,
  p.envio_resumo
FROM public.time_entries te
INNER JOIN public.profiles p ON te.employee_id = p.id;

-- Criar view para resumo diário de pontos
DROP VIEW IF EXISTS public.v_daily_summary CASCADE;
CREATE VIEW public.v_daily_summary AS
SELECT 
  employee_id,
  employee_name,
  DATE(punch_time) as date,
  COUNT(*) as total_entries,
  SUM(CASE WHEN punch_type = 'IN' THEN 1 ELSE 0 END) as clock_ins,
  SUM(CASE WHEN punch_type = 'OUT' THEN 1 ELSE 0 END) as clock_outs,
  SUM(CASE WHEN punch_type = 'BREAK_OUT' THEN 1 ELSE 0 END) as break_outs,
  SUM(CASE WHEN punch_type = 'BREAK_IN' THEN 1 ELSE 0 END) as break_ins,
  MIN(punch_time) as first_entry,
  MAX(punch_time) as last_entry
FROM public.v_time_entries_completo
GROUP BY employee_id, employee_name, DATE(punch_time);