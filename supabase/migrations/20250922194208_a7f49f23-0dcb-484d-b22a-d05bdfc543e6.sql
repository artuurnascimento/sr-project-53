-- Criar função para promover usuário a admin pelo email
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Executar após criar o usuário manualmente
-- SELECT promote_user_to_admin('admin@sirius.com');