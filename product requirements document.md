# Product Requirements Document (PRD)

## Product Name: Prompt Vault

---

# 1. Executive Summary

Prompt Vault is a secure, enterprise-grade web application that enables users to centrally store, organize, version,
search, and selectively share Large Language Model (LLM) prompts.

The product is:

* **Private-by-default**
* **Single-user focused (V1)**
* **Enterprise-toned (dark UI with yellow accent)**
* Designed for both novice AI users and advanced prompt engineers

The core value proposition:

> A single, structured, searchable vault for LLM prompts with version history, secure sharing, and professional-grade
> UX.

---

# 2. Goals & Objectives

## Primary Goals

1. Provide a **single source of truth** for prompts.
2. Enable **fast retrieval** via full-text search + filters.
3. Support **structured organization** (folders, tags, favorites).
4. Maintain complete **version history with diff comparison**.
5. Allow secure **read-only sharing with expiration**.
6. Support **forking with permanent attribution**.
7. Deliver a polished **enterprise-grade UX**.

## Success Criteria (V1)

* Users can locate a stored prompt within 5 seconds using search or filters.
* All prompt updates create retrievable versions.
* Shared links properly expire or revoke.
* Forked prompts permanently attribute original author.
* UI feels professional, structured, and reliable.

---

# 3. Target Users

### 1. Novice AI Users

* Want simplicity.
* Need a safe place to store working prompts.
* Value search and folders.

### 2. Prompt Engineers / Power Users

* Need version diffing.
* Use tags heavily.
* Want keyboard shortcuts.
* Share and fork prompts intentionally.

---

# 4. Core Problems Being Solved

1. Prompts are scattered across multiple storage locations.
2. Users cannot quickly find the right prompt when needed.
3. No version history for iterative prompt refinement.
4. Sharing prompts lacks control and expiration.
5. No centralized, structured organization system.

---

# 5. Product Scope (V1)

## Included

* Email/password authentication
* Prompt CRUD
* Folder management
* Tag management
* Favorites
* Full-text search with filters
* Version history with side-by-side diff
* Read-only share links with expiration
* Forking with permanent attribution
* Export as `.txt`
* Enterprise dark UI
* Keyboard shortcuts

## Excluded (V1)

* Collaboration editing
* Teams/workspaces
* Mobile apps
* Real-time editing
* Diff complexity beyond basic highlight
* Monetization (product is free)

---

# 6. Technical Architecture

## Backend

* Spring Boot (REST API)

    * spring-boot-starter-webmvc
    * spring-boot-starter-data-jdbc
    * spring-boot-starter-security
* REST-based architecture
* DB with full-text search capability
* Designed for:

    * Hundreds of prompts per user
    * Large prompt bodies
    * ~10 concurrent users at launch

## Frontend

* React SPA
* TailwindCSS
* react-router-dom
* Dark mode default
* Enterprise aesthetic
* Yellow accent color system

---

# 7. Information Architecture

## Routes

* `/login`
* `/register`
* `/app`
* `/app/prompts/new`
* `/app/prompts/:id`
* `/app/prompts/:id/history`
* `/app/prompts/:id/sharing`
* `/share/:token`

---

# 8. UI / UX Specification

---

## 8.1 Layout Structure

### Main App Layout

Two-column layout:

**Left Sidebar**

* Collapsible Folders section
* Collapsible Tags section
* Favorites shortcut
* All Prompts shortcut

**Main Panel**

* Search bar at top
* Filters below search
* Prompt list
* Editor view (when opened)

---

## 8.2 Visual Design System

### Tone

* Serious & enterprise
* Structured spacing
* No playful elements

### Color System

* Background: deep charcoal / black
* Surface panels: slightly lighter dark gray
* Accent: yellow (used for):

    * Primary buttons
    * Active state indicators
    * Diff additions
    * Focus highlights
* Red: deletions in diff
* Gray tones for neutral states

### Typography

* Clean sans-serif
* Strong hierarchy
* No decorative fonts

---

## 8.3 Prompt List View

Each list item displays:

* Title
* Folder name
* Tags
* Favorite icon
* Last updated date

No body preview shown.

---

## 8.4 Search & Filtering

### Behavior

* Search bar at top
* Filters directly below:

    * Folder dropdown
    * Tag multi-select
    * Favorites toggle
    * Sort dropdown

### Interaction

* Live updating results (debounced)
* No Enter required

### Sorting

* Most recently updated
* Alphabetical
* Most recently created

---

## 8.5 Editor Experience

### Mode

Toggle between:

* View Mode (Markdown rendered)
* Edit Mode (Rich Markdown editor)

### Markdown Support

* Headings
* Bold / Italic
* Lists
* Code blocks
* Syntax highlighting
* Inline variables

### Saving

* Manual save only
* Save button required
* Cmd/Ctrl + S shortcut

### Unsaved Changes

Custom modal:

> "You have unsaved changes. Leave without saving?"

Options:

* Cancel
* Leave
* Save & Leave

---

## 8.6 Version History

### Display

Side-by-side comparison layout.

Left: previous version
Right: selected version

### Diff

Basic highlighting:

* Additions → Yellow highlight
* Deletions → Red highlight

### Restore

"Restore This Version" button
Restoring creates a new version entry.

---

## 8.7 Sharing UX

### Editor Share Button

* Instantly generates link
* Expiration editable after creation
* Copy button

### Sharing Management Tab

Separate tab:

* List of active links
* Expiration date shown
* Revoke button
* Expired links not active

---

## 8.8 Public Share Page

Displays:

* Title
* Rendered Markdown content
* Author
* Expiration date
* Copy-to-clipboard button
* Download as `.txt`
* Fork button

### Expired / Revoked

Display:

> "Original no longer available."

---

## 8.9 Forking Behavior

If unauthenticated:

* Redirect to login/register
* After login → auto-create copy

Forked Prompt:

* Copies content only
* Does NOT copy version history

### Permanent Attribution

At top of forked prompt (non-editable):

> Forked from [Author Name] – View Original

* Attribution cannot be removed
* Clicking “View Original”:

    * If unavailable → show "Original no longer available"

---

## 8.10 Folder Management

* Collapsible in sidebar
* Create / Rename / Delete
* Prompts moved via dropdown in editor only
* No drag-and-drop in V1

---

## 8.11 Tags

* Collapsible in sidebar
* Multi-tag filtering
* Autocomplete suggestions
* Tags scoped per user

---

## 8.12 Keyboard Shortcuts

* Cmd/Ctrl + S → Save
* Cmd/Ctrl + K → Focus global search
* Cmd/Ctrl + Shift + F → Focus search input
* Esc → Close modal

---

# 9. Data Model (High-Level)

### user

* id
* email
* password_hash
* created_at

### prompt

* id
* user_id
* folder_id
* title
* current_body
* is_favorite
* attribution_original_prompt_id (nullable)
* attribution_original_author (nullable)
* created_at
* updated_at
* comments

### prompt_version

* id
* prompt_id
* version_number
* body_snapshot
* created_at

### folder

* id
* user_id
* name
* comments

### tag

* id
* user_id
* name
* comments

### prompt_tag

* prompt_id
* tag_id

### share_link

* id
* prompt_id
* token
* expires_at
* revoked_at
* created_at
* comments

---

# 10. Security Requirements

* All endpoints require authentication except public share.
* Share tokens must be long random strings.
* Authorization enforced per user.
* Fork attribution immutable.
* Expired links inaccessible.

---

# 11. Non-Functional Requirements

* Search latency < 500ms (hundreds of prompts).
* No data loss in versioning.
* Secure password hashing.
* Clean, predictable REST APIs.
* Maintainable schema for future scaling.

---

# 12. MVP Definition

The product is considered MVP-complete when:

* Users can register/login.
* Prompts can be created, edited, versioned.
* Search + filters work live.
* Share links generate and expire correctly.
* Forks create attributed copies.
* Version diff shows additions/deletions visually.
* UI matches enterprise dark + yellow accent design.

---

# 13. Future Roadmap (Post-V1)

* Teams & workspaces
* Role-based permissions
* Bulk operations
* Diff improvements
* Import/export enhancements
* API keys
* Analytics dashboard
* Prompt variable system

---

# 14. Risks

| Risk                         | Mitigation                                                              |
|------------------------------|-------------------------------------------------------------------------|
| Full-text search performance | Use DB-native full-text index                                           |
| Diff complexity              | Keep basic highlight only                                               |
| Share token abuse            | Rate limit public endpoint                                              |
| Attribution manipulation     | Store attribution metadata separately and render as locked UI component |

---

# 15. Final Product Vision

Prompt Vault becomes the structured operating system for prompt engineering:

* Centralized
* Secure
* Searchable
* Versioned
* Shareable
* Attributed
* Professional-grade

