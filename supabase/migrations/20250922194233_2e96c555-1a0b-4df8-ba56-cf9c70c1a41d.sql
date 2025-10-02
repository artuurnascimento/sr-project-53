-- Corrigir função para ter search_path seguro
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar perfil para admin baseado no email
  UPDATE public.profiles 
  SET 
    role = 'admin',
    full_name = 'Administrador do Sistema',
    updated_at = now()
  WHERE email = user_email;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Usuário promovido a administrador com sucesso'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário não encontrado'
    );
  END IF;
END;
$$;