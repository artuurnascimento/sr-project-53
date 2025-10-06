-- Add foreign key constraint between facial_recognition_audit and profiles
ALTER TABLE public.facial_recognition_audit
ADD CONSTRAINT facial_recognition_audit_profile_id_fkey
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_facial_recognition_audit_profile_id 
ON public.facial_recognition_audit(profile_id);