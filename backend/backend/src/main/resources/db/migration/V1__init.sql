-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User table
CREATE TABLE "user"
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT        NOT NULL,
    comments      TEXT,
    created_at    TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP   NOT NULL DEFAULT now()
);

-- Folder table
CREATE TABLE folder
(
    id         UUID PRIMARY KEY   DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES "user" (id),
    name       TEXT      NOT NULL,
    comments   TEXT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

-- Tag table
CREATE TABLE tag
(
    id         UUID PRIMARY KEY   DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES "user" (id),
    name       TEXT      NOT NULL,
    comments   TEXT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

-- Prompt table
CREATE TABLE prompt
(
    id                    UUID PRIMARY KEY   DEFAULT gen_random_uuid(),
    user_id               UUID      NOT NULL REFERENCES "user" (id),
    folder_id             UUID REFERENCES folder (id),
    title                 TEXT      NOT NULL,
    current_body          TEXT      NOT NULL,
    is_favorite           BOOLEAN   NOT NULL DEFAULT false,
    comments              TEXT,
    forked_from_prompt_id UUID REFERENCES prompt (id),
    forked_from_author    TEXT,
    row_version           INTEGER   NOT NULL DEFAULT 0,
    deleted_at            TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP NOT NULL DEFAULT now(),
    search_vector         tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(current_body, '')), 'B')
        ) STORED
);

CREATE INDEX idx_prompt_search ON prompt USING GIN (search_vector);
CREATE INDEX idx_prompt_user ON prompt (user_id);

-- Prompt version table
CREATE TABLE prompt_version
(
    id             UUID PRIMARY KEY   DEFAULT gen_random_uuid(),
    prompt_id      UUID      NOT NULL REFERENCES prompt (id),
    version_number INTEGER   NOT NULL,
    body_snapshot  TEXT      NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (prompt_id, version_number)
);

-- Prompt Tag (Join Table)
CREATE TABLE prompt_tag
(
    prompt_id UUID REFERENCES prompt (id),
    tag_id    UUID REFERENCES tag (id),
    PRIMARY KEY (prompt_id, tag_id)
);

-- Share link table
CREATE TABLE share_link
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    prompt_id  UUID        NOT NULL REFERENCES prompt (id),
    token      TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_token ON share_link (token);

-- Password reset token table
CREATE TABLE password_reset_token
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES "user" (id),
    token      TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    used_at    TIMESTAMP,
    created_at TIMESTAMP   NOT NULL DEFAULT now()
);
