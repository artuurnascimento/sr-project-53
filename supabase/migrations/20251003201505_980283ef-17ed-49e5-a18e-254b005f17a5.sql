-- Create bucket for justification attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'justification-attachments',
  'justification-attachments',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

-- Policy: Users can upload their own attachments
CREATE POLICY "Users can upload their own justification attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'justification-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own attachments
CREATE POLICY "Users can view their own justification attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'justification-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins and managers can view all attachments
CREATE POLICY "Admins and managers can view all justification attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'justification-attachments'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
);

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own justification attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'justification-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);