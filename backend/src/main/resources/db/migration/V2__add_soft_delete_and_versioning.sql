-- Add deleted_at and row_version to "user" table
ALTER TABLE "user"
    ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE "user"
    ADD COLUMN row_version INTEGER NOT NULL DEFAULT 0;

-- Add row_version to folder table
ALTER TABLE folder
    ADD COLUMN row_version INTEGER NOT NULL DEFAULT 0;

-- Add row_version to tag table
ALTER TABLE tag
    ADD COLUMN row_version INTEGER NOT NULL DEFAULT 0;

-- Add deleted_at and row_version to prompt_version table
ALTER TABLE prompt_version
    ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE prompt_version
    ADD COLUMN row_version INTEGER NOT NULL DEFAULT 0;

-- Add deleted_at and row_version to share_link table
ALTER TABLE share_link
    ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE share_link
    ADD COLUMN row_version INTEGER NOT NULL DEFAULT 0;

-- Add deleted_at and row_version to password_reset_token table
ALTER TABLE password_reset_token
    ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE password_reset_token
    ADD COLUMN row_version INTEGER NOT NULL DEFAULT 0;
