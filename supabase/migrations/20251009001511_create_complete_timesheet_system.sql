/*
  # Sistema Completo de Ponto Eletrônico

  1. Extensões
    - Habilita UUID para geração de IDs únicos

  2. Funções Auxiliares
    - `update_updated_at_column()` - Atualiza automaticamente updated_at
    - `get_current_user_role()` - Retorna o papel do usuário atual
    - `get_current_user_profile_id()` - Retorna o ID do perfil do usuário atual
    - `handle_new_user()` - Cria perfil automaticamente ao registrar usuário

  3. Tabelas Principais
    - `profiles` - Perfis de usuários/colaboradores
    - `time_entries` - Registros de ponto (entrada/saída/pausas)
    - `justifications` - Solicitações e justificativas
    - `activity_logs` - Logs de auditoria
    - `registrations` - Cadastros gerais (admin)
    - `integrations` - Integrações com sistemas externos
    - `logs_sistema` - Logs do sistema

  4. Storage
    - Bucket `comprovantes` para armazenar PDFs dos comprovantes

  5. Views
    - `v_time_entries_completo` - View com dados completos de pontos
    - `v_daily_summary` - Resumo diário de pontos por colaborador

  6. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas restritivas por papel (employee/manager/admin)
    - Políticas de storage para comprovantes públicos
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  department TEXT,
  position TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'manager')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  envio_resumo TEXT NOT NULL DEFAULT 'diario' CHECK (envio_resumo IN ('diario', 'semanal', 'mensal', 'todos')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de registros de ponto
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  punch_type TEXT NOT NULL CHECK (punch_type IN ('IN', 'OUT', 'BREAK_IN', 'BREAK_OUT')),
  punch_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_lat NUMERIC(10, 8),
  location_lng NUMERIC(11, 8),
  location_address TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  comprovante_pdf TEXT,
  email_enviado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de justificativas
CREATE TABLE IF NOT EXISTS public.justifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('absence', 'overtime', 'vacation', 'expense', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_review')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de cadastros gerais
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de integrações
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  integration_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN DEFAULT false,
  last_sync TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS public.logs_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  referencia_id UUID,
  mensagem TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_sistema ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares de segurança
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  SELECT id INTO profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Políticas RLS para profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Políticas RLS para time_entries
DROP POLICY IF EXISTS "Employees can manage their own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Managers can view all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Managers can update time entries" ON public.time_entries;

CREATE POLICY "Employees can manage their own time entries"
  ON public.time_entries
  FOR ALL
  TO authenticated
  USING (employee_id = public.get_current_user_profile_id())
  WITH CHECK (employee_id = public.get_current_user_profile_id());

CREATE POLICY "Managers can view all time entries"
  ON public.time_entries
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Managers can update time entries"
  ON public.time_entries
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Políticas RLS para justifications
DROP POLICY IF EXISTS "Employees can view their own justifications" ON public.justifications;
DROP POLICY IF EXISTS "Employees can create their own justifications" ON public.justifications;
DROP POLICY IF EXISTS "Managers can view all justifications" ON public.justifications;
DROP POLICY IF EXISTS "Managers can update justifications" ON public.justifications;

CREATE POLICY "Employees can view their own justifications" 
ON public.justifications FOR SELECT 
TO authenticated
USING (employee_id = public.get_current_user_profile_id());

CREATE POLICY "Employees can create their own justifications" 
ON public.justifications FOR INSERT 
TO authenticated
WITH CHECK (employee_id = public.get_current_user_profile_id());

CREATE POLICY "Managers can view all justifications" 
ON public.justifications FOR SELECT 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "Managers can update justifications" 
ON public.justifications FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'manager'));

-- Políticas RLS para activity_logs
DROP POLICY IF EXISTS "Users can view their own activity" ON public.activity_logs;
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_logs;
DROP POLICY IF EXISTS "All authenticated users can create activity logs" ON public.activity_logs;

CREATE POLICY "Users can view their own activity" 
ON public.activity_logs FOR SELECT 
TO authenticated
USING (user_id = public.get_current_user_profile_id());

CREATE POLICY "Admins can view all activity" 
ON public.activity_logs FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "All authenticated users can create activity logs" 
ON public.activity_logs FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas RLS para registrations
DROP POLICY IF EXISTS "Only admins can manage registrations" ON public.registrations;

CREATE POLICY "Only admins can manage registrations" 
ON public.registrations FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Políticas RLS para integrations
DROP POLICY IF EXISTS "Only admins can manage integrations" ON public.integrations;

CREATE POLICY "Only admins can manage integrations" 
ON public.integrations FOR ALL 
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Políticas RLS para logs_sistema
DROP POLICY IF EXISTS "Admins can view all logs" ON public.logs_sistema;
DROP POLICY IF EXISTS "System can create logs" ON public.logs_sistema;

CREATE POLICY "Admins can view all logs" 
ON public.logs_sistema FOR SELECT 
TO authenticated
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can create logs" 
ON public.logs_sistema FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON public.time_entries;
DROP TRIGGER IF EXISTS update_justifications_updated_at ON public.justifications;
DROP TRIGGER IF EXISTS update_registrations_updated_at ON public.registrations;
DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_justifications_updated_at
  BEFORE UPDATE ON public.justifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'employee'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para performance
CREATE INDEX IF NOT EXISTS time_entries_employee_id_idx ON public.time_entries(employee_id);
CREATE INDEX IF NOT EXISTS time_entries_punch_time_idx ON public.time_entries(punch_time);
CREATE INDEX IF NOT EXISTS time_entries_status_idx ON public.time_entries(status);

-- Criar bucket de comprovantes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'comprovantes',
  'comprovantes',
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Políticas de storage
DROP POLICY IF EXISTS "Comprovantes são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Sistema pode criar comprovantes" ON storage.objects;

CREATE POLICY "Comprovantes são publicamente acessíveis"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprovantes');

CREATE POLICY "Sistema pode criar comprovantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprovantes');

-- Views auxiliares
CREATE OR REPLACE VIEW public.v_time_entries_completo AS
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

CREATE OR REPLACE VIEW public.v_daily_summary AS
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