---
name: playwright-e2e
description: Run and maintain Playwright end-to-end tests for a full-stack application with a Vite + React + TypeScript frontend and a Spring Boot 4.0 REST API backend. Use this skill whenever the user mentions Playwright, E2E tests, end-to-end tests, integration tests, browser tests, test automation, or test maintenance for their app. Also trigger when the user asks to add tests for a new feature, fix a flaky test, debug a failing test, add API mocking, set up test infrastructure, create Page Object Models, run tests in CI, generate test reports, or improve test coverage — even if they don't explicitly say "Playwright." If the user says "write a test for this page" or "make sure this flow works," use this skill.
---

# Playwright E2E Testing Skill

Runs and maintains Playwright end-to-end tests for a full-stack app: **Vite + React + TypeScript** frontend, **Spring
Boot 4.0** REST API backend.

## Stack Context

Understanding the stack prevents wasted cycles:

- **Frontend**: Vite dev server (default `http://localhost:5173`), React 18/19, TypeScript, likely using React Router
  for navigation
- **Backend**: Spring Boot 4.0 (Spring Framework 7, Java 17+, Maven or Gradle), REST controllers, likely running on
  `http://localhost:8080`
- **Spring Boot 4.0 specifics**: Modular jars, JSpecify null-safety, HTTP Service Clients, API versioning support,
  Hibernate 7.1, Spring Security 7 — be aware these may affect API paths, auth flows, and response shapes

## Project Structure

Maintain this directory layout at the project root. If it doesn't exist yet, create it. If a different layout is already
in use, adapt to the existing structure rather than forcing this one.

```
e2e/
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── fixtures/
│   └── base.ts               # Extended test fixtures (authenticated page, API context, etc.)
├── pages/
│   ├── BasePage.ts            # Shared helpers (nav, wait, toast assertions)
│   └── <feature>Page.ts       # One POM per major UI area
├── helpers/
│   ├── api.ts                 # Direct REST calls for setup/teardown (hits Spring Boot)
│   ├── auth.ts                # Login helpers, token/session management
│   └── data-factory.ts        # Builders for test entities
├── tests/
│   ├── smoke/                 # Critical-path happy-path tests (~2 min)
│   ├── features/              # Feature-area tests grouped by domain
│   └── api/                   # API-only tests (no browser, uses APIRequestContext)
├── global-setup.ts            # One-time setup: health checks, seed data, auth state
├── global-teardown.ts         # Cleanup: remove test data, close connections
└── .env.test                  # Test-specific env vars (API base URL, test credentials)
```

## Configuration

Generate or update `e2e/playwright.config.ts` with these principles:

```typescript
import {defineConfig, devices} from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve(__dirname, '.env.test')});

export default defineConfig({
    testDir: './tests',
    outputDir: './test-results',

    /* Fail the build on CI if test.only is left in source */
    forbidOnly: !!process.env.CI,

    /* Retry flaky tests on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Parallel workers — tune to machine cores */
    workers: process.env.CI ? 2 : undefined,

    /* Reporter: HTML locally, CI gets list + junit for pipeline integration */
    reporter: process.env.CI
        ? [['list'], ['junit', {outputFile: 'test-results/junit.xml'}]]
        : [['html', {open: 'on-failure'}]],

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        /* Default timeout per action (click, fill, etc.) */
        actionTimeout: 10_000,
    },

    /* Projects: chromium is the workhorse; add others as needed */
    projects: [
        {name: 'setup', testMatch: /global-setup\.ts/},
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
            dependencies: ['setup'],
        },
        {
            name: 'firefox',
            use: {...devices['Desktop Firefox']},
            dependencies: ['setup'],
        },
        {
            name: 'api-tests',
            testDir: './tests/api',
            use: {baseURL: process.env.API_BASE_URL || 'http://localhost:8080'},
        },
    ],

    /* Start both frontend and backend before tests run */
    webServer: [
        {
            command: 'npm run dev',
            url: 'http://localhost:5173',
            cwd: '../frontend',        // adjust to actual frontend dir
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
        {
            command: './mvnw spring-boot:run', // or ./gradlew bootRun
            url: 'http://localhost:8080/actuator/health',
            cwd: '../backend',         // adjust to actual backend dir
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,          // Spring Boot cold start can be slow
        },
    ],
});
```

Key decisions behind this config:

- **Two `webServer` entries** start both Vite and Spring Boot. The backend health check URL uses the Spring Actuator
  endpoint — confirm the user has `spring-boot-starter-actuator` and that the health endpoint is exposed.
- **A dedicated `api-tests` project** runs headless API tests pointing at the backend directly, which is faster than
  going through the browser for pure API validation.
- **Traces, screenshots, video** are retained only on failure to avoid bloating CI artifacts.

## Writing Tests

### Guiding Principles

1. **Test user-visible behavior, not implementation.** Use semantic locators (`getByRole`, `getByLabel`, `getByText`,
   `getByPlaceholder`) over CSS selectors or `data-testid`. Fall back to `data-testid` only when no semantic alternative
   exists.
2. **Each test is fully isolated.** No test should depend on another's state. Use API helpers to set up preconditions;
   don't navigate through the UI for setup.
3. **Prefer `await expect(locator).toBeVisible()` over `waitForSelector`.** Playwright's auto-waiting handles most
   timing issues — avoid explicit sleeps entirely.
4. **Keep tests short and focused.** One logical assertion flow per test. If a test is doing more than one user journey,
   split it.
5. **Mock the network when testing the frontend in isolation.** Use `page.route()` to intercept Spring Boot API calls.
   Test the real integration separately in the `api/` test directory.

### Page Object Model Pattern

Every major page or component area gets a POM. POMs encapsulate locators and actions so tests read like user stories.

```typescript
// e2e/pages/LoginPage.ts
import {type Page, type Locator} from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly submitButton: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.getByLabel('Username');
        this.passwordInput = page.getByLabel('Password');
        this.submitButton = page.getByRole('button', {name: 'Sign in'});
        this.errorMessage = page.getByRole('alert');
    }

    async goto() {
        await this.page.goto('/login');
    }

    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }
}
```

### Custom Fixtures

Extend the base `test` object so every test gets reusable context without boilerplate.

```typescript
// e2e/fixtures/base.ts
import {test as base} from '@playwright/test';
import {LoginPage} from '../pages/LoginPage';

type Fixtures = {
    loginPage: LoginPage;
    authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
    loginPage: async ({page}, use) => {
        await use(new LoginPage(page));
    },
    authenticatedPage: async ({browser}, use) => {
        // Reuse stored auth state to skip login UI in every test
        const context = await browser.newContext({
            storageState: 'e2e/.auth/user.json',
        });
        const page = await context.newPage();
        await use(page);
        await context.close();
    },
});

export {expect} from '@playwright/test';
```

### Auth State Reuse

Logging in through the UI for every test is slow. Instead, capture auth state once in global setup and reuse it:

```typescript
// e2e/global-setup.ts
import {chromium, type FullConfig} from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Login via UI once
    await page.goto('http://localhost:5173/login');
    await page.getByLabel('Username').fill(process.env.TEST_USER!);
    await page.getByLabel('Password').fill(process.env.TEST_PASS!);
    await page.getByRole('button', {name: 'Sign in'}).click();
    await page.waitForURL('**/dashboard');

    // Persist auth state
    await page.context().storageState({path: 'e2e/.auth/user.json'});
    await browser.close();
}

export default globalSetup;
```

If the app uses JWT tokens stored in `localStorage` or cookies, adjust accordingly — the key idea is to avoid
re-authenticating through the UI on every test.

For Spring Security 7 setups, the auth flow may involve CSRF tokens, OAuth2 redirects, or session cookies. Inspect the
actual login response to determine what to persist.

### API Helpers for Test Data

Hit the Spring Boot API directly to create/destroy test data. This is faster and more reliable than UI-driven setup.

```typescript
// e2e/helpers/api.ts
import {APIRequestContext} from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

export async function createTestUser(
    request: APIRequestContext,
    userData: { username: string; email: string }
) {
    const response = await request.post(`${API_BASE}/api/v1/users`, {
        data: userData,
        headers: {Authorization: `Bearer ${process.env.ADMIN_TOKEN}`},
    });
    if (!response.ok()) {
        throw new Error(`Failed to create user: ${response.status()}`);
    }
    return response.json();
}

export async function deleteTestUser(
    request: APIRequestContext,
    userId: string
) {
    await request.delete(`${API_BASE}/api/v1/users/${userId}`, {
        headers: {Authorization: `Bearer ${process.env.ADMIN_TOKEN}`},
    });
}
```

Note on Spring Boot 4.0 API versioning: the framework now has built-in support for API versioning. Inspect the app's
controller annotations to determine the correct path prefix (e.g., `/api/v1/`, `/v2/`, or header-based versioning).

### Network Mocking for Frontend Isolation Tests

Use `page.route()` to intercept REST calls and return controlled data:

```typescript
test('displays user list from API', async ({page}) => {
    await page.route('**/api/v1/users', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {id: '1', name: 'Alice', email: 'alice@test.com'},
                {id: '2', name: 'Bob', email: 'bob@test.com'},
            ]),
        })
    );

    await page.goto('/users');
    await expect(page.getByText('Alice')).toBeVisible();
    await expect(page.getByText('Bob')).toBeVisible();
});
```

This pattern is especially useful when the Spring Boot backend is unavailable or when testing error states (e.g., 500
responses, network timeouts, empty results).

### Pure API Tests (No Browser)

For testing the REST API directly without a browser:

```typescript
// e2e/tests/api/users.api.spec.ts
import {test, expect} from '@playwright/test';

test.describe('Users API', () => {
    test('GET /api/v1/users returns 200', async ({request}) => {
        const response = await request.get('/api/v1/users');
        expect(response.status()).toBe(200);

        const users = await response.json();
        expect(Array.isArray(users)).toBe(true);
    });

    test('POST /api/v1/users validates required fields', async ({request}) => {
        const response = await request.post('/api/v1/users', {
            data: {email: ''}, // missing username
        });
        expect(response.status()).toBe(400);
    });
});
```

These run in the `api-tests` project defined in the config, pointing `baseURL` directly at Spring Boot.

## Running Tests

Standard commands — add these to the `e2e/package.json` scripts:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:smoke": "playwright test --grep @smoke",
    "test:api": "playwright test --project=api-tests",
    "test:debug": "playwright test --debug",
    "report": "playwright show-report"
  }
}
```

Tag smoke tests with `test.describe` annotations or inline tags:

```typescript
test('user can log in and see dashboard @smoke', async ({page}) => {
    // ...
});
```

## Maintaining Tests

### When the User Adds a New Feature

1. Ask which page or flow the feature affects.
2. Create or update the POM for that page.
3. Add API helpers if new endpoints are involved.
4. Write tests in the appropriate `tests/features/` subdirectory.
5. Add a `@smoke` tag if the feature is on the critical path.
6. Run the full suite to check for regressions.

### When a Test is Flaky

Diagnose before fixing:

1. Run with `--repeat-each=5` to reproduce locally.
2. Check the trace: `npx playwright show-trace test-results/<test>/trace.zip`.
3. Common culprits in this stack:
    - **Vite HMR interfering**: The dev server may reload mid-test. Consider running tests against a `vite preview` (
      production build) instead of `vite dev`.
    - **Spring Boot cold start**: The backend may not be ready. Ensure the `webServer` config waits for the actuator
      health endpoint.
    - **React state timing**: The UI re-renders after API responses. Use `await expect(locator).toBeVisible()` instead
      of immediate assertions.
    - **CORS or CSRF**: Spring Security 7 defaults may block requests. Check the Spring Security filter chain config.
4. Fix the root cause. If the fix requires a timing workaround, document why in a comment. Never use
   `page.waitForTimeout()` unless there is absolutely no observable state change to wait for.

### When the API Contract Changes

1. Update `e2e/helpers/api.ts` to match new request/response shapes.
2. Update `page.route()` mocks in affected tests.
3. Run the `api-tests` project first to validate the contract, then run browser tests.
4. If using Spring Boot 4.0's API versioning, verify tests target the correct version.

## CI/CD Integration

Playwright provides a GitHub Actions workflow. Key considerations:

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [ push, pull_request ]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'    # or 21/25 depending on project

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install frontend deps
        run: cd frontend && npm ci

      - name: Build frontend
        run: cd frontend && npm run build

      - name: Install Playwright
        run: cd e2e && npm ci && npx playwright install --with-deps

      - name: Run E2E tests
        run: cd e2e && npm test
        env:
          CI: true
          BASE_URL: http://localhost:4173     # vite preview port
          API_BASE_URL: http://localhost:8080

      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: e2e/playwright-report/
          retention-days: 14

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-traces
          path: e2e/test-results/
          retention-days: 7
```

On CI, run against a production build (`vite preview`) rather than `vite dev` to match what users actually experience
and avoid HMR-related flakiness.

## Checklist for Every Test Change

Before committing, verify:

- [ ] Tests pass locally: `npx playwright test`
- [ ] No `test.only` left in code
- [ ] No hardcoded URLs — use `baseURL` from config or env vars
- [ ] No `page.waitForTimeout()` calls without a justifying comment
- [ ] New POMs are in `pages/`, new helpers in `helpers/`
- [ ] API test data is cleaned up in `afterAll` or `afterEach`
- [ ] Smoke-critical tests are tagged `@smoke`
- [ ] Traces and screenshots are configured for failure-only capture

## Troubleshooting Quick Reference

| Symptom                               | Likely Cause                             | Fix                                                             |
|---------------------------------------|------------------------------------------|-----------------------------------------------------------------|
| Tests timeout before page loads       | Vite or Spring Boot not started          | Check `webServer` config, verify health URLs                    |
| `ERR_CONNECTION_REFUSED` on API calls | Backend not running or wrong port        | Verify `API_BASE_URL`, check Spring Boot logs                   |
| Auth tests fail intermittently        | Stored auth state expired                | Regenerate `.auth/user.json` in global setup; check JWT expiry  |
| CORS errors in test console           | Spring Security blocking cross-origin    | Add test profile CORS config or use `page.route()` to bypass    |
| Element not found after navigation    | React Router async rendering             | `await page.waitForURL()` then assert element visibility        |
| Tests pass locally, fail on CI        | Headed vs headless rendering differences | Run `--headed` locally to debug; check viewport sizes in config |
| Flaky on parallel runs                | Shared test data conflicts               | Ensure each test creates its own data via API helpers           |