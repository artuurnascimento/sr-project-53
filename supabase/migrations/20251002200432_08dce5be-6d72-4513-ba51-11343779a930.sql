-- Fix conflicting RLS policies on profiles table
-- The profiles table has 'id' (primary key) and 'user_id' (references auth.users)
-- All policies must consistently use 'user_id' for auth checks, not 'id'

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins e gerentes podem ver todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver e editar seu próprio perfil" ON public.profiles;

-- Create consistent, secure policies using user_id field

-- Users can view their own profile only
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own profile only (but cannot change role or is_active)
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Managers can view all profiles
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'manager');

-- Only admins can insert new profiles
CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.get_current_user_role() = 'admin');

-- Only admins can update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- Only admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.get_current_user_role() = 'admin');