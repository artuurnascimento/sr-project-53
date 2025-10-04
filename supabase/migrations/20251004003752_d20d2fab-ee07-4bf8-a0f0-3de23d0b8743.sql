-- Recreate the function with the existing return type (json) to implement secure linking logic
CREATE OR REPLACE FUNCTION public.link_audit_to_time_entry(
  _audit_id uuid,
  _time_entry_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_profile uuid;
  audit_profile uuid;
  entry_employee uuid;
BEGIN
  -- Current user's profile id
  SELECT get_current_user_profile_id() INTO current_profile;

  IF current_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_profile');
  END IF;

  -- Audit ownership
  SELECT profile_id INTO audit_profile 
  FROM public.facial_recognition_audit 
  WHERE id = _audit_id;

  IF audit_profile IS NULL OR audit_profile <> current_profile THEN
    RETURN json_build_object('success', false, 'error', 'audit_not_owned');
  END IF;

  -- Time entry ownership
  SELECT employee_id INTO entry_employee
  FROM public.time_entries
  WHERE id = _time_entry_id;

  IF entry_employee IS NULL OR entry_employee <> current_profile THEN
    RETURN json_build_object('success', false, 'error', 'time_entry_not_owned');
  END IF;

  -- Perform link if not set
  UPDATE public.facial_recognition_audit
  SET time_entry_id = _time_entry_id
  WHERE id = _audit_id
    AND time_entry_id IS NULL;

  RETURN json_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.link_audit_to_time_entry(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_audit_to_time_entry(uuid, uuid) TO authenticated;