-- Existing values are preserved; newly added priority/category columns get defaults.
ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority VARCHAR(255) DEFAULT 'MEDIUM';
ALTER TABLE todos ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'Genel';
-- Unknown historical timestamps remain null.
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(6) WITH TIME ZONE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(6) WITH TIME ZONE;
