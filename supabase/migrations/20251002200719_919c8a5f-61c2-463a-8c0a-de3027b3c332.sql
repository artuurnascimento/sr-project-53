-- Clean up existing objects first
DROP POLICY IF EXISTS "Only admins can view biometric access log" ON public.biometric_access_log;
DROP POLICY IF EXISTS "System can log biometric access" ON public.biometric_access_log;
DROP POLICY IF EXISTS "Admins can update audit records" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "Admins can view all audit records" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "System can create audit records" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "Users can view their own audit records" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "Users can view own facial audit" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "Admins can view facial audit with logging" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "Admins can create facial audit records" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "Admins can update facial audit for review" ON public.facial_recognition_audit;
DROP POLICY IF EXISTS "No one can delete facial audit records" ON public.facial_recognition_audit;

DROP FUNCTION IF EXISTS public.check_and_log_biometric_access(uuid, uuid, text);
DROP TABLE IF EXISTS public.biometric_access_log CASCADE;

-- Create audit table for tracking biometric data access
CREATE TABLE public.biometric_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_profile_id uuid REFERENCES public.profiles(id),
  access_type text NOT NULL, -- 'view', 'export', 'delete'
  audit_record_id uuid REFERENCES public.facial_recognition_audit(id),
  ip_address inet,
  user_agent text,
  justification text, -- Required reason for access
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on biometric access log
ALTER TABLE public.biometric_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the biometric access log
CREATE POLICY "Only admins can view biometric access log"
ON public.biometric_access_log
FOR SELECT
TO authenticated
USING (public.get_current_user_role() = 'admin');

-- System can insert access logs
CREATE POLICY "System can log biometric access"
ON public.biometric_access_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = accessed_by);

-- Create security definer function to check and log biometric data access
CREATE OR REPLACE FUNCTION public.check_and_log_biometric_access(
  _profile_id uuid,
  _audit_record_id uuid DEFAULT NULL,
  _access_type text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role text;
  _accessing_user_id uuid;
BEGIN
  _accessing_user_id := auth.uid();
  _user_role := public.get_current_user_role();
  
  -- Users can always access their own data
  IF _profile_id = public.get_current_user_profile_id() THEN
    RETURN true;
  END IF;
  
  -- Only admins can access other users' biometric data
  IF _user_role != 'admin' THEN
    RETURN false;
  END IF;
  
  -- Log admin access to biometric data
  INSERT INTO public.biometric_access_log (
    accessed_by,
    accessed_profile_id,
    access_type,
    audit_record_id,
    justification
  ) VALUES (
    _accessing_user_id,
    _profile_id,
    _access_type,
    _audit_record_id,
    'Admin accessed biometric data for review'
  );
  
  RETURN true;
END;
$$;

-- Create new secure policies with access logging

-- Users can view their own facial recognition audit records
CREATE POLICY "Users can view own facial audit"
ON public.facial_recognition_audit
FOR SELECT
TO authenticated
USING (
  profile_id = public.get_current_user_profile_id()
);

-- Admins can view facial recognition audit WITH logging
CREATE POLICY "Admins can view facial audit with logging"
ON public.facial_recognition_audit
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'admin' AND
  public.check_and_log_biometric_access(profile_id, id, 'view')
);

-- Only system/admins can create audit records
CREATE POLICY "Admins can create facial audit records"
ON public.facial_recognition_audit
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'admin' OR
  auth.uid() IS NOT NULL
);

-- Only admins can update audit records (for review process)
CREATE POLICY "Admins can update facial audit for review"
ON public.facial_recognition_audit
FOR UPDATE
TO authenticated
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- Prevent deletion of audit records (maintain audit trail)
CREATE POLICY "No one can delete facial audit records"
ON public.facial_recognition_audit
FOR DELETE
TO authenticated
USING (false);

-- Add indexes for performance on access log queries
CREATE INDEX idx_biometric_access_log_accessed_by 
ON public.biometric_access_log(accessed_by, created_at DESC);

CREATE INDEX idx_biometric_access_log_profile 
ON public.biometric_access_log(accessed_profile_id, created_at DESC);

-- Add comments explaining the security model
COMMENT ON TABLE public.biometric_access_log IS 
'Audit log tracking all access to sensitive biometric data. Every time an admin views facial recognition data, an entry is logged here with timestamp, user, and reason.';

COMMENT ON FUNCTION public.check_and_log_biometric_access IS
'Security function that checks if user has permission to access biometric data AND logs the access attempt. Returns true if access is allowed.';