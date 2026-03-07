# Prompt Vault — Implementation Tasks

After each task is done, update the task status to "done" and stop for a manual verification.

---

# Phase 1 — Project Foundation

## Project Setup

- [x] PV-1: Create backend Spring Boot project
- [x] PV-1: Create frontend React + Tailwind project
- [x] PV-2: Define API conventions and error format
- [x] PV-3: Configure Docker Compose (Postgres + backend)

---

# Phase 2 — Database Layer

## Database & Migrations

- [x] PV-10: Add Flyway and baseline migration
- [x] PV-10: Enable pgcrypto extension
- [x] PV-10: Create tables (user, folder, tag, prompt, prompt_version, prompt_tag, share_link, password_reset_token)
- [x] PV-10: Create indexes (GIN search, token index, user index)
- [x] PV-11: Add soft delete support (`deleted_at`)
- [x] PV-12: Add optimistic locking column (`row_version`)

---

# Phase 3 — Authentication (JWT)

## Auth Core

- [x] PV-20: Implement user registration endpoint
- [x] PV-21: Implement login (JWT + HttpOnly cookie)
- [x] PV-22: Implement logout
- [x] PV-23: Configure Spring Security filter chain
- [x] PV-24: Implement `/api/me` endpoint

---

# Phase 4 — Prompt Core (CRUD + Versioning)

## Prompt CRUD

- [x] PV-60: Create prompt endpoint (initial version entry)
- [x] PV-61: Read prompt + list prompts
- [x] PV-62: Update prompt with optimistic locking
- [x] PV-62: Enforce version cap (50 versions)
- [x] PV-63: Soft delete prompt

---

# Phase 5 — Folder Management

## Folder CRUD

- [x] PV-40: Folder create/list/rename endpoints
- [x] PV-41: Sidebar folder UI
- [x] PV-42: Folder delete transactional flow (move/delete/cancel)

---

# Phase 6 — Tag Management

## Tag CRUD

- [x] PV-50: Tag endpoints
- [x] PV-51: Tag delete removes prompt_tag relations
- [x] PV-52: Sidebar tag UI
- [x] PV-64: Assign tags to prompt

---

# Phase 7 — Search & Filtering

## Full-Text Search

- [x] PV-70: Implement search API with ts_rank
- [x] PV-71: Implement filters (folder, tags, favorites)
- [x] PV-72: Frontend live search (debounced)

---

# Phase 8 — Editor UX

## Editor

- [x] PV-80: Prompt editor page structure
- [x] PV-81: Integrate TipTap (edit mode)
- [x] PV-82: Markdown render (view mode)
- [x] PV-83: Manual save + Cmd/Ctrl+S
- [x] PV-84: Unsaved changes modal

---

# Phase 9 — Version History + Diff

## Version History

- [x] PV-90: Version list API
- [x] PV-91: Restore version API
- [x] PV-92: History tab UI
- [x] PV-93: Basic diff highlighting (additions yellow, deletions red)

---

# Phase 10 — Sharing

## Share Links

- [x] PV-100: Create share link API (instant)
- [x] PV-101: List share links API
- [x] PV-102: Edit expiration
- [x] PV-103: Revoke share link
- [x] PV-104: Public share endpoint
- [x] PV-105: Public share page UI
- [x] PV-106: Export as .txt (private + public)

---

# Phase 11 — Forking

## Fork Flow

- [x] PV-110: Fork endpoint (copy content, attribution set)
- [x] PV-111: Permanent attribution UI banner
- [x] PV-112: Handle expired/original unavailable case

---

# Phase 12 — Email Features

## Password Reset

- [x] PV-30: Configure SMTP
- [x] PV-31: Password reset request endpoint
- [x] PV-32: Password reset confirm endpoint
- [x] PV-33: Frontend reset pages

## Email Share

- [x] PV-120: Email share link endpoint
- [x] PV-121: Sharing tab email UI

---

# Phase 13 — UI Polish & Keyboard Shortcuts

## UX Enhancements

- [ ] PV-130: Collapsible sidebar (persist state)
- [ ] PV-131: Keyboard shortcuts (Cmd+K, Cmd+S, etc.)
- [ ] PV-132: Enterprise dark theme + yellow accents

---

# Phase 14 — Observability & Safety

## Hardening

- [ ] PV-140: Structured logging (no prompt content)
- [ ] PV-141: Global exception handler
- [ ] PV-142: Input validation + size limits

---

# Phase 15 — Deployment

## Production Setup

- [ ] PV-150: Production Docker Compose
- [ ] PV-151: Nginx TLS + reverse proxy config
- [ ] Smoke test full deployment

---

# MVP Completion Checklist

- [ ] Auth works end-to-end
- [ ] Prompt CRUD with version cap works
- [ ] Full-text search performs under 500ms
- [ ] Version diff works visually
- [ ] Share links validate and expire correctly
- [ ] Forking preserves attribution permanently
- [ ] Password reset works
- [ ] App deploys successfully via Docker + Nginx
