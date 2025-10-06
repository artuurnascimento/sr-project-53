-- Create RLS policies for facial-audit bucket

-- Allow authenticated users to upload their own facial audit images
CREATE POLICY "Users can upload facial audit images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'facial-audit' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to view their own facial audit images
CREATE POLICY "Users can view facial audit images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'facial-audit' AND
  auth.uid() IS NOT NULL
);

-- Allow admins to view all facial audit images
CREATE POLICY "Admins can view all facial audit images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'facial-audit' AND
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Allow admins to delete facial audit images
CREATE POLICY "Admins can delete facial audit images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'facial-audit' AND
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);