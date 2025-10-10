-- Criar tabela de horários de trabalho
CREATE TABLE IF NOT EXISTS public.work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  clock_in_time TIME NOT NULL DEFAULT '08:00:00',
  clock_out_time TIME NOT NULL DEFAULT '17:00:00',
  break_start_time TIME NOT NULL DEFAULT '12:00:00',
  break_end_time TIME NOT NULL DEFAULT '13:00:00',
  tolerance_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem gerenciar horários"
  ON public.work_schedules
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Colaboradores podem ver seus horários"
  ON public.work_schedules
  FOR SELECT
  USING (profile_id = get_current_user_profile_id());

-- Criar índice para melhor performance
CREATE INDEX idx_work_schedules_profile_id ON public.work_schedules(profile_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_work_schedules_updated_at
  BEFORE UPDATE ON public.work_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.work_schedules IS 'Horários de trabalho configurados para cada colaborador';
COMMENT ON COLUMN public.work_schedules.clock_in_time IS 'Horário esperado de entrada';
COMMENT ON COLUMN public.work_schedules.clock_out_time IS 'Horário esperado de saída';
COMMENT ON COLUMN public.work_schedules.break_start_time IS 'Horário esperado de início do intervalo';
COMMENT ON COLUMN public.work_schedules.break_end_time IS 'Horário esperado de fim do intervalo';
COMMENT ON COLUMN public.work_schedules.tolerance_minutes IS 'Tolerância em minutos para batimento de ponto';