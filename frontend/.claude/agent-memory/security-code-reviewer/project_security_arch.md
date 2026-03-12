---
name: project_security_arch
description: Overall security posture, authentication model, known sensitive areas, and recurring patterns in the prompt-vault codebase
type: project
---

## Auth Model

- JWT stored in HttpOnly cookie (not Authorization header). Cookie-based auth means CSRF is a real concern since CSRF
  protection is explicitly disabled in SecurityConfig.
- Cookie name: `jwt`. SameSite=Lax. `secure=false` hardcoded in AuthService — must be changed for production.
- JWT expiration: 7 days (604800000ms), configured in application.yaml.
- No token revocation mechanism (no blocklist, no refresh tokens).

## Sensitive Areas

- `AuthController` / `AuthService` — login, register, logout, password reset flows (all under `/api/auth/**`, fully
  permitAll).
- `ShareLinkService` — public share endpoint at `/api/share/{token}` is unauthenticated by design.
- `PasswordResetService` — uses UUID-based tokens; correctly silences user enumeration on requestReset.
- `ForkController` — forks a public share into a user's vault; requires auth.

## Known Vulnerabilities (as of 2026-03-11)

- Hardcoded fallback DB password in application.yaml (CRITICAL).
- Hardcoded fallback JWT secret in application.yaml (CRITICAL).
- `secure=false` on auth cookie in AuthService (HIGH).
- CSRF disabled globally with no mitigating CSRF token header check (MEDIUM).
- Share token entropy: UUID v4 stripped of hyphens = 32 hex chars = 128 bits — acceptable.
- `findByToken` (no deletedAt filter) used in `getPublicShare` — revoked check is done in application code; functionally
  OK but slightly inconsistent with `findByTokenAndDeletedAtIsNull`.
- No rate limiting on auth endpoints or password reset endpoint.
- `exportPublicShare` uses basic regex HTML strip — not a full sanitization; content-type is text/plain so XSS risk is
  low but filename sanitization is present.
- All queries use named parameters (no SQL injection risk found).
- `PromptResponse` exposes `userId` to the client — information leakage, not a direct exploit.
- `UserController` uses `SecurityContextHolder` directly instead of `@AuthenticationPrincipal` — inconsistent pattern
  but functionally safe.

## Security Configurations in Place

- BCryptPasswordEncoder used for password hashing.
- Spring Security with stateless session management.
- `@Valid` present on all controller request bodies that accept user input.
- All data-access methods include userId scoping (user data isolation is enforced at query level).
- GlobalExceptionHandler does not expose stack traces to clients.
- Actuator: only `/actuator/health` is permitAll; other actuator endpoints require auth.
- Password reset tokens: single-use (usedAt check), 1-hour expiry, stored with deletedAt soft-delete.

**Why:** Recorded to build institutional knowledge across security review sessions.
**How to apply:** Use as baseline context when reviewing new changes; flag deviations from established patterns.
