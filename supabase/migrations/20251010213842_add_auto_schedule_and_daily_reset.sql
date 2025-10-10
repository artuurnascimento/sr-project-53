/*
  # Horário Padrão Automático e Reset Diário de Batimentos
  
  1. Mudanças
    - Cria função para criar horário padrão automaticamente quando um novo colaborador é cadastrado
    - Cria trigger que executa a função automaticamente após criação de profile
    - Cria função para calcular quais tipos de batimento estão disponíveis baseado no horário configurado
    - A função de reset considera:
      * Horário de entrada (IN) - disponível antes/durante o horário de entrada + tolerância
      * Início de intervalo (BREAK_OUT) - disponível antes/durante o horário de início de intervalo + tolerância
      * Fim de intervalo (BREAK_IN) - disponível antes/durante o horário de fim de intervalo + tolerância
      * Saída (OUT) - disponível antes/durante o horário de saída + tolerância
    - Cada tipo de batimento só fica disponível no seu período específico, evitando disponibilidade 24h
  
  2. Segurança
    - Funções criadas com SECURITY DEFINER para permitir acesso controlado
    - Apenas colaboradores autenticados podem verificar disponibilidade de batimento
  
  3. Notas Importantes
    - Horário padrão: Entrada 08:00, Saída 17:00, Intervalo 12:00-13:00, Tolerância 15 minutos
    - Batimentos só ficam disponíveis no período esperado + tolerância
    - Sistema verifica se o colaborador já bateu o ponto antes de liberar próximo batimento
*/

-- Função para criar horário padrão quando um novo colaborador é criado
CREATE OR REPLACE FUNCTION public.create_default_work_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir horário padrão para o novo colaborador
  INSERT INTO public.work_schedules (
    profile_id,
    clock_in_time,
    clock_out_time,
    break_start_time,
    break_end_time,
    tolerance_minutes,
    is_active
  ) VALUES (
    NEW.id,
    '08:00:00'::time,
    '17:00:00'::time,
    '12:00:00'::time,
    '13:00:00'::time,
    15,
    true
  )
  ON CONFLICT (profile_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS create_default_schedule_on_profile_creation ON public.profiles;

-- Criar trigger para executar a função após criar um profile
CREATE TRIGGER create_default_schedule_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_work_schedule();

-- Função para verificar quais batimentos estão disponíveis no momento atual
CREATE OR REPLACE FUNCTION public.get_available_punch_types(
  p_profile_id UUID,
  p_current_datetime TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  punch_type TEXT,
  is_available BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  v_schedule RECORD;
  v_current_time TIME;
  v_current_date DATE;
  v_today_entries RECORD;
  v_has_clock_in BOOLEAN := false;
  v_has_break_out BOOLEAN := false;
  v_has_break_in BOOLEAN := false;
  v_has_clock_out BOOLEAN := false;
  v_clock_in_start TIME;
  v_clock_in_end TIME;
  v_break_out_start TIME;
  v_break_out_end TIME;
  v_break_in_start TIME;
  v_break_in_end TIME;
  v_clock_out_start TIME;
  v_clock_out_end TIME;
BEGIN
  -- Obter horário configurado do colaborador
  SELECT * INTO v_schedule
  FROM public.work_schedules
  WHERE profile_id = p_profile_id AND is_active = true;
  
  -- Se não tem horário configurado, não permite nenhum batimento
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 'IN'::TEXT, false, 'Horário de trabalho não configurado'::TEXT
    UNION ALL
    SELECT 'BREAK_OUT'::TEXT, false, 'Horário de trabalho não configurado'::TEXT
    UNION ALL
    SELECT 'BREAK_IN'::TEXT, false, 'Horário de trabalho não configurado'::TEXT
    UNION ALL
    SELECT 'OUT'::TEXT, false, 'Horário de trabalho não configurado'::TEXT;
    RETURN;
  END IF;
  
  -- Extrair hora e data atual
  v_current_time := p_current_datetime::TIME;
  v_current_date := p_current_datetime::DATE;
  
  -- Calcular janelas de tempo para cada tipo de batimento (horário - tolerância até horário + tolerância)
  v_clock_in_start := v_schedule.clock_in_time - (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  v_clock_in_end := v_schedule.clock_in_time + (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  
  v_break_out_start := v_schedule.break_start_time - (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  v_break_out_end := v_schedule.break_start_time + (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  
  v_break_in_start := v_schedule.break_end_time - (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  v_break_in_end := v_schedule.break_end_time + (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  
  v_clock_out_start := v_schedule.clock_out_time - (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  v_clock_out_end := v_schedule.clock_out_time + (v_schedule.tolerance_minutes || ' minutes')::INTERVAL;
  
  -- Verificar batimentos já registrados hoje
  FOR v_today_entries IN
    SELECT punch_type
    FROM public.time_entries
    WHERE employee_id = p_profile_id
      AND DATE(punch_time) = v_current_date
    ORDER BY punch_time DESC
  LOOP
    CASE v_today_entries.punch_type
      WHEN 'IN' THEN v_has_clock_in := true;
      WHEN 'BREAK_OUT' THEN v_has_break_out := true;
      WHEN 'BREAK_IN' THEN v_has_break_in := true;
      WHEN 'OUT' THEN v_has_clock_out := true;
    END CASE;
  END LOOP;
  
  -- Retornar disponibilidade de cada tipo de batimento
  -- ENTRADA (IN)
  IF NOT v_has_clock_in THEN
    IF v_current_time BETWEEN v_clock_in_start AND v_clock_in_end THEN
      RETURN QUERY SELECT 'IN'::TEXT, true, 'Disponível para registrar entrada'::TEXT;
    ELSE
      RETURN QUERY SELECT 'IN'::TEXT, false, 'Fora do horário de entrada'::TEXT;
    END IF;
  ELSE
    RETURN QUERY SELECT 'IN'::TEXT, false, 'Entrada já registrada hoje'::TEXT;
  END IF;
  
  -- INÍCIO INTERVALO (BREAK_OUT)
  IF v_has_clock_in AND NOT v_has_break_out THEN
    IF v_current_time BETWEEN v_break_out_start AND v_break_out_end THEN
      RETURN QUERY SELECT 'BREAK_OUT'::TEXT, true, 'Disponível para iniciar intervalo'::TEXT;
    ELSE
      RETURN QUERY SELECT 'BREAK_OUT'::TEXT, false, 'Fora do horário de início do intervalo'::TEXT;
    END IF;
  ELSIF NOT v_has_clock_in THEN
    RETURN QUERY SELECT 'BREAK_OUT'::TEXT, false, 'É necessário registrar entrada primeiro'::TEXT;
  ELSE
    RETURN QUERY SELECT 'BREAK_OUT'::TEXT, false, 'Início de intervalo já registrado hoje'::TEXT;
  END IF;
  
  -- FIM INTERVALO (BREAK_IN)
  IF v_has_break_out AND NOT v_has_break_in THEN
    IF v_current_time BETWEEN v_break_in_start AND v_break_in_end THEN
      RETURN QUERY SELECT 'BREAK_IN'::TEXT, true, 'Disponível para finalizar intervalo'::TEXT;
    ELSE
      RETURN QUERY SELECT 'BREAK_IN'::TEXT, false, 'Fora do horário de fim do intervalo'::TEXT;
    END IF;
  ELSIF NOT v_has_break_out THEN
    RETURN QUERY SELECT 'BREAK_IN'::TEXT, false, 'É necessário iniciar intervalo primeiro'::TEXT;
  ELSE
    RETURN QUERY SELECT 'BREAK_IN'::TEXT, false, 'Fim de intervalo já registrado hoje'::TEXT;
  END IF;
  
  -- SAÍDA (OUT)
  IF v_has_clock_in AND NOT v_has_clock_out THEN
    IF v_current_time BETWEEN v_clock_out_start AND v_clock_out_end THEN
      RETURN QUERY SELECT 'OUT'::TEXT, true, 'Disponível para registrar saída'::TEXT;
    ELSE
      RETURN QUERY SELECT 'OUT'::TEXT, false, 'Fora do horário de saída'::TEXT;
    END IF;
  ELSIF NOT v_has_clock_in THEN
    RETURN QUERY SELECT 'OUT'::TEXT, false, 'É necessário registrar entrada primeiro'::TEXT;
  ELSE
    RETURN QUERY SELECT 'OUT'::TEXT, false, 'Saída já registrada hoje'::TEXT;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Comentários
COMMENT ON FUNCTION public.create_default_work_schedule() IS 'Cria automaticamente um horário padrão quando um novo colaborador é cadastrado';
COMMENT ON FUNCTION public.get_available_punch_types(UUID, TIMESTAMPTZ) IS 'Retorna quais tipos de batimento de ponto estão disponíveis baseado no horário configurado e registros do dia';

-- Grant de permissões
GRANT EXECUTE ON FUNCTION public.get_available_punch_types(UUID, TIMESTAMPTZ) TO authenticated;
