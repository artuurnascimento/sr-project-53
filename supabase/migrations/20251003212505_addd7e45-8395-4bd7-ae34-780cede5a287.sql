-- Backfill facial_recognition_audit records for existing time entries without audit linkage
-- Idempotent: only inserts for time entries that don't have an audit yet
INSERT INTO public.facial_recognition_audit (
  profile_id,
  attempt_image_url,
  recognition_result,
  confidence_score,
  liveness_passed,
  status,
  created_at,
  time_entry_id
)
SELECT 
  te.employee_id AS profile_id,
  'backfill/' || te.id::text || '.jpg' AS attempt_image_url,
  jsonb_build_object(
    'success', true,
    'source', 'backfill_from_time_entries',
    'punch_type', te.punch_type
  ) AS recognition_result,
  NULL::numeric AS confidence_score,
  false AS liveness_passed,
  CASE WHEN te.status = 'approved' THEN 'approved' ELSE 'pending' END AS status,
  te.punch_time AS created_at,
  te.id AS time_entry_id
FROM public.time_entries te
LEFT JOIN public.facial_recognition_audit fra
  ON fra.time_entry_id = te.id
WHERE fra.id IS NULL;