-- Link audit record to time entry securely
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
  _profile_id uuid;
  _audit_profile uuid;
  _entry_employee uuid;
BEGIN
  -- Get current user's profile id
  _profile_id := public.get_current_user_profile_id();

  -- Ensure audit record exists and belongs to current user
  SELECT profile_id INTO _audit_profile
  FROM public.facial_recognition_audit
  WHERE id = _audit_id;

  IF _audit_profile IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Audit record not found');
  END IF;

  IF _audit_profile <> _profile_id THEN
    RETURN json_build_object('success', false, 'message', 'Not authorized to link this audit');
  END IF;

  -- Ensure time entry exists and belongs to same profile
  SELECT employee_id INTO _entry_employee
  FROM public.time_entries
  WHERE id = _time_entry_id;

  IF _entry_employee IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Time entry not found');
  END IF;

  IF _entry_employee <> _profile_id THEN
    RETURN json_build_object('success', false, 'message', 'Time entry does not belong to current user');
  END IF;

  -- Link audit to time entry
  UPDATE public.facial_recognition_audit
  SET time_entry_id = _time_entry_id
  WHERE id = _audit_id;

  RETURN json_build_object('success', true);
END;
$$;