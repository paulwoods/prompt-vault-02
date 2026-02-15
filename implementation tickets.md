Below is a **Jira-style backlog** broken into epics + implementation tickets (small, testable units). I’m assuming:
Spring Boot + Data JDBC + Spring Security, PostgreSQL + Flyway, React + Tailwind + react-router-dom, TipTap editor,
Docker + Nginx.

---

## EPIC 0 — Project Setup & Standards

**PV-1: Create repos and base project skeletons**

* Backend: Spring Boot app with WebMVC, Security, Data JDBC, Flyway
* Frontend: React + Tailwind + router
* Acceptance: both apps run locally; basic health page renders

**PV-2: Add shared conventions**

* API base path `/api`
* Standard error response shape
* DTO naming conventions
* Acceptance: documented in `README.md`

**PV-3: Local dev environment (Docker Compose)**

* Postgres container + app containers
* Env var wiring
* Acceptance: `docker compose up` brings up DB + backend; frontend runs locally

---

## EPIC 1 — Database & Migrations

**PV-10: Add Flyway and baseline migration**

* Enable `pgcrypto`
* Create tables: `user`, `folder`, `tag`, `prompt`, `prompt_version`, `prompt_tag`, `share_link`, `password_reset_token`
* Add indexes (GIN on `prompt.search_vector`, token index)
* Acceptance: migrations apply cleanly on empty DB

**PV-11: Add soft-delete columns + query conventions**

* Ensure `deleted_at` exists on `folder`, `tag`, `prompt`
* Acceptance: all repository queries filter `deleted_at IS NULL`

**PV-12: Add optimistic locking column and constraints**

* Ensure `prompt.row_version` default 0
* Acceptance: update requires version match

---

## EPIC 2 — Authentication & User Management (JWT + Cookies)

**PV-20: Implement user registration**

* `POST /api/auth/register`
* Validate email format + password min rules
* Store `password_hash` (BCrypt)
* Acceptance: can register and login with created user

**PV-21: Implement login (JWT issued, HttpOnly cookie set)**

* `POST /api/auth/login`
* Issue JWT (7d expiry)
* Set cookie `access_token` HttpOnly Secure SameSite=Lax
* Acceptance: authenticated request succeeds after login

**PV-22: Implement logout**

* `POST /api/auth/logout`
* Clears cookie
* Acceptance: subsequent requests return 401

**PV-23: Configure Spring Security filter chain**

* Permit public endpoints: auth routes, public share routes
* Protect all `/api/**` routes by default
* Add JWT auth filter parsing cookie
* Acceptance: unauthorized requests get 401

**PV-24: User profile endpoint**

* `GET /api/me` returns user id/email/comments
* `PUT /api/me` updates `comments` only (optional)
* Acceptance: user can view and update comments

---

## EPIC 3 — Password Reset via Email (SMTP)

**PV-30: SMTP configuration**

* Add Spring Mail dependencies/config via env vars
* Acceptance: app starts with SMTP config; can send test email in dev

**PV-31: Password reset request endpoint**

* `POST /api/auth/password-reset-request` (email)
* Generate 256-bit token, store with 1h expiry
* Send email with reset URL
* Acceptance: token stored; email sent (can verify via logs/dev SMTP)

**PV-32: Password reset confirm endpoint**

* `POST /api/auth/password-reset-confirm` (token + new password)
* Validate token exists, not expired, not used
* Update password hash; set `used_at`
* Acceptance: user can login with new password; token cannot be reused

**PV-33: Frontend password reset pages**

* `/forgot-password` request form
* `/reset-password?token=...` set new password
* Acceptance: end-to-end reset works

---

## EPIC 4 — Folder Management (with delete flow)

**PV-40: Folder CRUD endpoints**

* `GET /api/folder`
* `POST /api/folder`
* `PUT /api/folder/{id}`
* `DELETE /api/folder/{id}` (special flow in PV-42)
* Acceptance: create/rename/list works; scoped to user

**PV-41: Folder UI in sidebar**

* Collapsible “Folders”
* Create folder action
* Rename via inline or modal
* Acceptance: folders render and can be managed

**PV-42: Folder delete modal + backend support**

* Modal options:

    * Move prompts to another folder
    * Delete all prompts in folder
    * Cancel
* Backend: `POST /api/folder/{id}/delete` with action payload
* Transactional behavior
* Acceptance: both actions work and are atomic

---

## EPIC 5 — Tag Management

**PV-50: Tag CRUD endpoints**

* `GET /api/tag`
* `POST /api/tag` (or implicit creation in prompt edit)
* `PUT /api/tag/{id}` (optional)
* `DELETE /api/tag/{id}` (soft delete)
* Acceptance: tags are user-scoped and listed

**PV-51: Tag delete behavior**

* On delete: soft-delete tag + remove all `prompt_tag` relations
* Acceptance: deleted tag disappears and is removed from prompts

**PV-52: Tag UI in sidebar**

* Collapsible “Tags”
* Tag list with click-to-filter
* Acceptance: clicking a tag filters prompt list

---

## EPIC 6 — Prompt CRUD + Organization + Optimistic Locking

**PV-60: Prompt create endpoint**

* `POST /api/prompt`
* Creates prompt + initial prompt_version (v1)
* Acceptance: new prompt appears in list and has version history entry

**PV-61: Prompt read endpoints**

* `GET /api/prompt/{id}`
* `GET /api/prompt` list (basic, no search yet)
* Acceptance: user can open prompt editor page

**PV-62: Prompt update endpoint with optimistic locking**

* `PUT /api/prompt/{id}` includes `row_version`
* On success:

    * update prompt
    * insert new prompt_version
    * enforce version cap (50)
* On conflict: return 409 with latest prompt payload
* Acceptance: conflict is detectable by editing in 2 tabs

**PV-63: Prompt delete (soft delete)**

* `DELETE /api/prompt/{id}`
* Acceptance: prompt disappears from list; versions remain or are deleted (pick one)

    * Recommendation: keep versions but prompt hidden; cleanup later

**PV-64: Tag assignment endpoints**

* `PUT /api/prompt/{id}/tag` with list of tag IDs (replace-all)
* Support creating new tag by name (optional)
* Acceptance: tags update on prompt and reflect in filters

**PV-65: Folder assignment in editor**

* Update prompt `folder_id` via `PUT /api/prompt/{id}`
* Acceptance: moving folder updates list metadata

**PV-66: Favorite toggle**

* `POST /api/prompt/{id}/favorite` or via update
* Acceptance: favorites filter works

---

## EPIC 7 — Full-Text Search + Filters + Sorting

**PV-70: Search API**

* `GET /api/prompt?query=&folderId=&tagIds=&favorite=&sort=`
* Use Postgres `search_vector` + `plainto_tsquery`
* Rank results + stable sort (rank desc, updated_at desc)
* Acceptance: searching finds title/body matches quickly

**PV-71: Filter logic**

* folder filter
* multi-tag filter
* favorites-only filter
* Acceptance: combinations work correctly

**PV-72: Frontend search UI**

* Search bar top + filters below
* Debounced live search
* Acceptance: typing updates list without Enter

---

## EPIC 8 — Editor UX (TipTap) + View/Edit Toggle + Unsaved Modal

**PV-80: Prompt editor page skeleton**

* `/app/prompts/:id` with tabs: Editor | Sharing | History
* Acceptance: navigation works

**PV-81: TipTap editor integration (edit mode)**

* Markdown editing support
* Code blocks + syntax highlight
* Acceptance: user can edit and save markdown content

**PV-82: Rendered markdown view mode**

* Toggle view/edit
* Acceptance: markdown renders correctly in view mode

**PV-83: Manual save button + Cmd/Ctrl+S**

* Save triggers update API call
* Handle 409 conflict UX (show modal with options)
* Acceptance: save works; shortcut works

**PV-84: Unsaved changes custom modal**

* On navigation attempt: show modal (Cancel / Leave / Save & Leave)
* Acceptance: works on route change and closing prompt

---

## EPIC 9 — Version History + Diff (Basic Highlight)

**PV-90: Version list API**

* `GET /api/prompt/{id}/version`
* `GET /api/prompt/{id}/version/{versionId}`
* Acceptance: returns versions ordered newest-first

**PV-91: Restore version API**

* `POST /api/prompt/{id}/version/{versionId}/restore`
* Creates a new latest version and updates prompt.current_body
* Enforce version cap (50)
* Acceptance: restore works and shows as newest version

**PV-92: History tab UI**

* Version list (timestamps + select)
* Side-by-side compare selected versions
* Acceptance: user can pick two versions to compare

**PV-93: Diff highlighting (basic)**

* Additions highlighted yellow, deletions red
* Use a diff library (word or line diff)
* Acceptance: visible diff for typical changes; handles large prompts

---

## EPIC 10 — Sharing Links + Public Share Page

**PV-100: Create share link API (instant)**

* `POST /api/prompt/{id}/share-link` → returns link + token
* Default expires_at null
* Acceptance: creating returns a working token

**PV-101: List share links API**

* `GET /api/prompt/{id}/share-link`
* Return active links (revoked_at null; include expires_at)
* Acceptance: list shows in Sharing tab

**PV-102: Edit expiration API**

* `PUT /api/share-link/{id}` update expires_at (set/change/clear)
* Acceptance: expiration updates correctly

**PV-103: Revoke share link API**

* `POST /api/share-link/{id}/revoke`
* Acceptance: revoked link stops working

**PV-104: Public share endpoint**

* `GET /api/public/share/{token}`
* Validate not revoked and not expired
* Return title, content, author, expiration
* Acceptance: public access works without auth

**PV-105: Public share page UI**

* `/share/:token` page shows: title, content, author, expiration, copy, download, fork
* Acceptance: matches UX requirements

**PV-106: Download as text (public + private)**

* `GET /api/prompt/{id}/export` (auth)
* `GET /api/public/share/{token}/export` (public)
* Acceptance: downloads `.txt` correctly

---

## EPIC 11 — Forking + Permanent Attribution

**PV-110: Fork endpoint**

* `POST /api/public/share/{token}/fork`
* Requires auth (if not logged in, frontend redirects)
* Creates new prompt:

    * current_body copied
    * forked_from_prompt_id set
    * forked_from_author snapshot set
    * no version history copied (but create initial version for fork)
* Acceptance: fork creates prompt with attribution

**PV-111: Attribution UI component**

* Non-editable banner at top:

    * “Forked from {author} – View Original”
* Permanent (no remove)
* Acceptance: always renders when fork fields present

**PV-112: “View Original” behavior**

* Link to original share URL (stored or reconstructed)
* If original unavailable: show “Original no longer available”
* Acceptance: correct message on expired/revoked

---

## EPIC 12 — Email Share Link

**PV-120: Email share endpoint**

* `POST /api/share-link/{id}/email` with recipient email
* Sends email with URL
* Acceptance: email sent successfully; no recipient persistence

**PV-121: Sharing tab UI “Email link” action**

* Recipient email input + send button
* Success toast
* Acceptance: end-to-end works

---

## EPIC 13 — UI Polish, Navigation, and Keyboard Shortcuts

**PV-130: Sidebar navigation + collapsible sections**

* Persist collapsed state in localStorage
* Acceptance: state persists across refresh

**PV-131: Keyboard shortcuts**

* Cmd/Ctrl+K focus global search
* Cmd/Ctrl+Shift+F focus search field
* Esc closes modals
* Acceptance: shortcuts function everywhere applicable

**PV-132: Enterprise dark theme + yellow accents**

* Tailwind theme tokens
* Buttons, focus rings, diff highlights use yellow accent
* Acceptance: consistent theming across app

---

## EPIC 14 — Observability & Safety

**PV-140: Structured logging**

* Auth events, share link create/revoke, password reset request
* Never log prompt content
* Acceptance: logs contain event types with IDs only

**PV-141: Global exception handler**

* Consistent error payloads (validation, 404, 409, 500)
* Acceptance: frontend can reliably show errors

**PV-142: Input validation layer**

* DTO validation annotations (email, size limits)
* Max prompt size policy (define limit; e.g., 200KB)
* Acceptance: oversized payloads rejected with clear error

---

## EPIC 15 — Deployment

**PV-150: Production Docker compose**

* app + postgres + nginx
* persistent volumes
* env vars
* Acceptance: deployable with one command

**PV-151: Nginx TLS + proxy config**

* HTTPS cert config
* Proxy headers
* Static frontend hosting (or separate container)
* Acceptance: app served over HTTPS and API proxied correctly

---

## Suggested Build Order (Fastest Path to Working Product)

1. PV-1 → PV-3 (setup)
2. PV-10 → PV-12 (DB)
3. PV-20 → PV-23 (auth)
4. PV-60 → PV-63 (prompt CRUD + versioning + locking)
5. PV-40 → PV-42 (folders)
6. PV-50 → PV-52 + PV-64 (tags)
7. PV-70 → PV-72 (search)
8. PV-80 → PV-84 (editor UX)
9. PV-90 → PV-93 (history + diff)
10. PV-100 → PV-106 (sharing + public page)
11. PV-110 → PV-112 (forking)
12. PV-30 → PV-33 + PV-120 → PV-121 (email flows)
13. PV-130 → PV-132 (polish + shortcuts)
14. PV-140 → PV-151 (hardening + deployment)

