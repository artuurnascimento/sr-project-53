-- Allow HTML proofs in 'comprovantes' bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/pdf', 'text/html', 'image/jpeg', 'image/png']
WHERE id = 'comprovantes';