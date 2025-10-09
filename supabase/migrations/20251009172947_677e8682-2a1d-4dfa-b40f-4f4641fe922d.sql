-- Atualizar configuração do bucket comprovantes para aceitar HTML
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/pdf', 'text/html', 'image/jpeg', 'image/png']
WHERE id = 'comprovantes';