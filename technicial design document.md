# Technical Design Document (TDD)

## Product: Prompt Vault

## Version: V1

## Stack: Spring Boot + PostgreSQL + React (TipTap) + Docker + Nginx

---

# 1. System Overview

Prompt Vault is a single-user-focused, secure web application for storing, organizing, versioning, searching, and
sharing LLM prompts.

Architecture:

```
Browser (React SPA)
        ↓
     Nginx (TLS termination)
        ↓
 Spring Boot API (JWT auth)
        ↓
   PostgreSQL
        ↓
     SMTP Server
```

Deployment:
Docker containers on a personal server behind Nginx.

---

# 2. Architecture Decisions

| Concern         | Decision                               |
|-----------------|----------------------------------------|
| Auth            | JWT (access token only)                |
| Token Storage   | HttpOnly Secure Cookie                 |
| DB              | PostgreSQL                             |
| IDs             | UUID (gen_random_uuid)                 |
| Search          | PostgreSQL Full-Text Search (tsvector) |
| Versioning      | Snapshot table with cap 50             |
| Delete Strategy | Soft delete (`deleted_at`)             |
| Concurrency     | Optimistic locking (`row_version`)     |
| Share Token     | 256-bit random URL-safe                |
| Email           | SMTP via Spring `JavaMailSender`       |
| Deployment      | Docker + Nginx                         |

---

# 3. Authentication & Security

## JWT Strategy

* Access token only
* Expiration: 7 days
* Signed with HS256
* Stored in HttpOnly + Secure cookie
* SameSite=Lax

### JWT Claims

```json
{
  "sub": "user_uuid",
  "email": "user@email.com",
   "iat": "timestamp",
   "exp": "timestamp"
}
```

---

## Auth Endpoints

| Method | Endpoint                         | Description      |
|--------|----------------------------------|------------------|
| POST   | /api/auth/register               | Register         |
| POST   | /api/auth/login                  | Login            |
| POST   | /api/auth/logout                 | Clear cookie     |
| POST   | /api/auth/password-reset-request | Send reset email |
| POST   | /api/auth/password-reset-confirm | Reset password   |

---

# 4. Database Schema

All tables singular.

---

## 4.1 Enable Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

---

## 4.2 user

```sql
CREATE TABLE "user"
(
    id            UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT        NOT NULL,
    comments      TEXT,
    created_at    TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP   NOT NULL DEFAULT now()
);
```

---

## 4.3 folder

```sql
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
```

---

## 4.4 tag

```sql
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
```

---

## 4.5 prompt

```sql
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
```

### Index

```sql
CREATE INDEX idx_prompt_search ON prompt USING GIN (search_vector);
CREATE INDEX idx_prompt_user ON prompt (user_id);
```

---

## 4.6 prompt_version

```sql
CREATE TABLE prompt_version
(
    id             UUID PRIMARY KEY   DEFAULT gen_random_uuid(),
    prompt_id      UUID      NOT NULL REFERENCES prompt (id),
    version_number INTEGER   NOT NULL,
    body_snapshot  TEXT      NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (prompt_id, version_number)
);
```

---

## 4.7 prompt_tag

```sql
CREATE TABLE prompt_tag
(
    prompt_id UUID REFERENCES prompt (id),
    tag_id    UUID REFERENCES tag (id),
    PRIMARY KEY (prompt_id, tag_id)
);
```

---

## 4.8 share_link

```sql
CREATE TABLE share_link
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    prompt_id  UUID        NOT NULL REFERENCES prompt (id),
    token      TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP   NOT NULL DEFAULT now()
);
```

Index:

```sql
CREATE INDEX idx_share_token ON share_link (token);
```

---

## 4.9 password_reset_token

```sql
CREATE TABLE password_reset_token
(
    id         UUID PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES "user" (id),
    token      TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    used_at    TIMESTAMP,
    created_at TIMESTAMP   NOT NULL DEFAULT now()
);
```

---

# 5. Full-Text Search

Query example:

```sql
SELECT *,
       ts_rank(search_vector, plainto_tsquery('english', :query)) AS rank
FROM prompt
WHERE user_id = :userId
  AND deleted_at IS NULL
  AND search_vector @@ plainto_tsquery('english', :query)
ORDER BY rank DESC, updated_at DESC;
```

---

# 6. Version Retention Logic

Max versions: 50.

On save:

1. Insert new version.
2. Count versions.
3. If > 50:

    * Delete oldest version (lowest version_number).

Version numbers are monotonic and never renumbered.

---

# 7. Optimistic Locking

Update query:

```sql
UPDATE prompt
SET title        = :title,
    current_body = :body,
    row_version  = row_version + 1,
    updated_at   = now()
WHERE id = :id
  AND row_version = :currentVersion;
```

If 0 rows affected → return 409 Conflict.

---

# 8. Share Token Generation

Generate 32 bytes random:

```java
SecureRandom random = new SecureRandom();
byte[] bytes = new byte[32];
random.

nextBytes(bytes);

String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
```

Length ≈ 43 chars.

---

# 9. Public Share Validation Logic

Valid if:

```
revoked_at IS NULL
AND (expires_at IS NULL OR expires_at > now())
```

Otherwise return 404-style response:

> "Original no longer available."

---

# 10. Folder Delete Flow

When deleting folder:

User chooses:

1. Move prompts to another folder
2. Soft-delete all prompts in folder
3. Cancel

Transaction must be atomic.

---

# 11. Tag Delete Behavior

On tag delete:

* Soft-delete tag
* Delete all `prompt_tag` rows referencing tag

---

# 12. Email Flows

## Password Reset

1. User requests reset.
2. Generate 256-bit token.
3. Insert into `password_reset_token`.
4. Send email with link:
   `/reset-password?token=XYZ`
5. On confirmation:

    * Validate not expired
    * Validate not used
    * Update password
    * Mark token `used_at`

Expiration: 1 hour.

---

## Share via Email

User enters recipient email.

System:

* Sends email containing share link.
* Does not store recipient email (stateless).

---

# 13. Docker Architecture

Containers:

* nginx
* app (Spring Boot)
* postgres

Network: internal bridge.

Environment variables:

* DB_URL
* DB_USER
* DB_PASSWORD
* JWT_SECRET
* SMTP_HOST
* SMTP_PORT
* SMTP_USER
* SMTP_PASS

---

# 14. Nginx Configuration

* TLS termination
* Proxy to app container
* Enable gzip
* Set secure headers
* Forward cookies

---

# 15. Security Considerations

* All queries scoped by `user_id`
* Soft delete always filtered
* Share token indexed
* JWT expiration enforced
* No rate limiting (V1)
* CSRF not required (JWT + SameSite=Lax cookie)
* Passwords hashed using BCrypt

---

# 16. API Error Format

```json
{
  "timestamp": "...",
  "status": 409,
  "error": "Conflict",
  "message": "Prompt has been modified.",
  "path": "/api/prompts/{id}"
}
```

---

# 17. Logging

* Log authentication events
* Log share creation
* Log password reset request
* Do NOT log prompt content

---

# 18. Migration Strategy

Use Flyway.

Versioned migrations:

* V1__init.sql
* V2__search_index.sql
* etc.

---

# 19. Future Scalability Considerations

* Move to refresh token system
* Add rate limiting
* Introduce Redis for caching
* Externalize SMTP
* Add API rate throttling
* Move to cloud RDS

---

# 20. Completion Criteria

System is production-ready when:

* JWT auth works end-to-end
* Prompt CRUD with versioning works
* Search returns ranked results
* Share links validate correctly
* Fork attribution immutable
* Password reset flow works
* Docker + Nginx deployment stable

---

# Final System State

Prompt Vault V1 is:

* Secure
* Search-optimized
* Version-controlled
* Soft-delete safe
* Optimistically locked
* Enterprise-styled
* Docker-deployable

