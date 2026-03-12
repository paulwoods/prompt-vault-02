ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
