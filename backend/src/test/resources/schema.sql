CREATE TABLE IF NOT EXISTS "user"
(
    id            UUID         NOT NULL DEFAULT RANDOM_UUID(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    comments      TEXT,
    deleted_at    TIMESTAMP,
    row_version   INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS folder
(
    id          UUID         NOT NULL DEFAULT RANDOM_UUID(),
    user_id     UUID         NOT NULL,
    name        VARCHAR(255) NOT NULL,
    comments    TEXT,
    deleted_at  TIMESTAMP,
    row_version INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE (user_id, name),
    FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE TABLE IF NOT EXISTS tag
(
    id          UUID         NOT NULL DEFAULT RANDOM_UUID(),
    user_id     UUID         NOT NULL,
    name        VARCHAR(255) NOT NULL,
    comments    TEXT,
    deleted_at  TIMESTAMP,
    row_version INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE (user_id, name),
    FOREIGN KEY (user_id) REFERENCES "user" (id)
);

CREATE TABLE IF NOT EXISTS prompt
(
    id                    UUID         NOT NULL DEFAULT RANDOM_UUID(),
    user_id               UUID         NOT NULL,
    folder_id             UUID,
    title                 VARCHAR(255) NOT NULL,
    current_body          TEXT         NOT NULL,
    is_favorite           BOOLEAN      NOT NULL DEFAULT FALSE,
    comments              TEXT,
    forked_from_prompt_id UUID,
    forked_from_author    VARCHAR(255),
    row_version           INTEGER      NOT NULL DEFAULT 0,
    deleted_at            TIMESTAMP,
    created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES "user" (id),
    FOREIGN KEY (folder_id) REFERENCES folder (id)
);

CREATE TABLE IF NOT EXISTS prompt_version
(
    id             UUID      NOT NULL DEFAULT RANDOM_UUID(),
    prompt_id      UUID      NOT NULL,
    version_number INTEGER   NOT NULL,
    body_snapshot  TEXT      NOT NULL,
    deleted_at     TIMESTAMP,
    row_version    INTEGER   NOT NULL DEFAULT 0,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    UNIQUE (prompt_id, version_number),
    FOREIGN KEY (prompt_id) REFERENCES prompt (id)
);

CREATE TABLE IF NOT EXISTS prompt_tag
(
    prompt_id UUID NOT NULL,
    tag_id    UUID NOT NULL,
    PRIMARY KEY (prompt_id, tag_id),
    FOREIGN KEY (prompt_id) REFERENCES prompt (id),
    FOREIGN KEY (tag_id) REFERENCES tag (id)
);
