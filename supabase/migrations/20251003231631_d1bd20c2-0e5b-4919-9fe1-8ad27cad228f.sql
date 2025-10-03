-- Atualizar registros antigos de backfill para placeholder
UPDATE facial_recognition_audit
SET attempt_image_url = 'placeholder://time-entry/' || time_entry_id
WHERE attempt_image_url LIKE 'backfill/%';