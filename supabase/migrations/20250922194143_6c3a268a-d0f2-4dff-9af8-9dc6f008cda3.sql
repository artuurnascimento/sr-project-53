-- Criar usuário administrador usando a função de autenticação
-- Como não podemos inserir diretamente em auth.users, vamos criar um usuário através de uma função

-- Primeiro, vamos criar uma função que permite criar usuários admin
CREATE OR REPLACE FUNCTION create_admin_user(
  email TEXT,
  password TEXT,
  full_name TEXT DEFAULT 'Administrador'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Esta função precisa ser executada manualmente via SQL no painel do Supabase
  -- pois não podemos criar usuários auth diretamente via migração
  
  -- Vamos criar apenas o perfil admin que será linkado manualmente
  INSERT INTO public.profiles (
    user_id,
    full_name,
    email,
    role,
    is_active
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    full_name,
    email,
    'admin',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    is_active = true;
    
  RETURN json_build_object(
    'success', true,
    'message', 'Perfil admin criado. Usuário deve ser criado manualmente no painel.'
  );
END;
$$;

-- Executar a função para criar o perfil admin
SELECT create_admin_user('admin@sirius.com', 'sirius2025', 'Administrador do Sistema');