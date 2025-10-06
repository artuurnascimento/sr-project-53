-- Allow managers to access facial audit records with logging
CREATE OR REPLACE FUNCTION public.check_and_log_biometric_access(_profile_id uuid, _audit_record_id uuid DEFAULT NULL::uuid, _access_type text DEFAULT 'view'::text)
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
  
  -- Admins and managers can access other users' biometric data (with logging)
  IF _user_role != ANY (ARRAY['admin','manager']) THEN
    RETURN false;
  END IF;
  
  -- Log privileged access to biometric data
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
    CASE WHEN _user_role = 'admin' THEN 'Admin accessed biometric data for review'
         ELSE 'Manager accessed biometric data for review' END
  );
  
  RETURN true;
END;
$$;

-- Update SELECT policy to include managers
DROP POLICY IF EXISTS "Admins can view facial audit with logging" ON public.facial_recognition_audit;
CREATE POLICY "Admins and managers can view facial audit with logging"
ON public.facial_recognition_audit
FOR SELECT
USING ((get_current_user_role() = ANY (ARRAY['admin','manager'])) AND check_and_log_biometric_access(profile_id, id, 'view'));