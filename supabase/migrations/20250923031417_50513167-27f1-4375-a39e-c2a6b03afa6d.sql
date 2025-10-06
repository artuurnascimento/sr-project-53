-- Fix storage policies for facial-references bucket
-- Allow authenticated users to upload their own facial reference images

-- Delete existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own facial references" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own facial references" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own facial references" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own facial references" ON storage.objects;

-- Create policies for facial-references bucket
CREATE POLICY "Users can upload their own facial references" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own facial references" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own facial references" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own facial references" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'facial-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);