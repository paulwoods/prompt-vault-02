---
name: vitest-unit
description: Write and maintain Vitest unit tests for a Vite + React + TypeScript frontend. Use this skill whenever the user mentions Vitest, unit tests, component tests, testing React components, testing hooks, testing utilities, mocking modules, snapshot tests, code coverage, or test-driven development for their React app. Also trigger when the user asks to add unit tests for a new component, test a custom hook, mock an API call in a unit test, set up testing infrastructure, improve code coverage, fix a broken unit test, or refactor tests — even if they don't explicitly say "Vitest." If the user says "test this component," "write a unit test," "mock this dependency," or "check coverage," use this skill.
---

# Vitest Unit Testing Skill

Writes and maintains Vitest unit tests for **Vite + React + TypeScript** projects using **React Testing Library** for
component tests and standard Vitest APIs for utility/hook/service tests.

## Stack Context

Understanding the stack avoids unnecessary trial and error:

- **Bundler**: Vite (uses esbuild/SWC for dev transforms, Rollup for production builds)
- **Test runner**: Vitest — shares the same Vite config and plugin pipeline, so aliases, transforms, and environment
  settings carry over automatically
- **Component testing**: `@testing-library/react` + `@testing-library/jest-dom` for DOM assertions +
  `@testing-library/user-event` for realistic user interactions
- **TypeScript**: Full TS support via Vite's transform pipeline — no separate `ts-jest` config needed
- **React version**: React 18 or 19 — both use `createRoot`; Testing Library handles this transparently

## Project Structure

Place test infrastructure at the project root alongside the Vite config. If a different layout already exists, adapt to
it rather than forcing this structure.

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx          # Co-located with component
│   └── UserList/
│       ├── UserList.tsx
│       └── UserList.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
├── utils/
│   ├── format.ts
│   └── format.test.ts
├── services/
│   ├── api.ts
│   └── api.test.ts
├── __mocks__/                       # Manual module mocks (Vitest auto-discovers)
│   └── zustand.ts
└── test/
    ├── setup.ts                     # Global test setup (DOM matchers, cleanup)
    ├── test-utils.tsx               # Custom render with providers (Router, Theme, Store)
    └── fixtures/                    # Shared test data builders and factories
        └── users.ts
vitest.config.ts                     # (or inline in vite.config.ts)
```

Co-locate test files next to source files (`Component.test.tsx` beside `Component.tsx`). This keeps tests discoverable
and makes imports short. Shared test utilities go in `src/test/`.

## Configuration

### Option A: Extend `vite.config.ts` (preferred for simple projects)

```typescript
/// <reference types="vitest/config" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        css: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/**/*.spec.{ts,tsx}',
                'src/test/**',
                'src/**/*.d.ts',
                'src/main.tsx',
                'src/vite-env.d.ts',
            ],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
    },
});
```

### Option B: Separate `vitest.config.ts` (preferred for complex projects)

Use this when the test config diverges significantly from the app config, or when using workspace mode:

```typescript
import {defineConfig, mergeConfig} from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./src/test/setup.ts'],
            css: true,
            include: ['src/**/*.{test,spec}.{ts,tsx}'],
            coverage: {
                provider: 'v8',
                reporter: ['text', 'html', 'lcov'],
                include: ['src/**/*.{ts,tsx}'],
                exclude: [
                    'src/**/*.test.{ts,tsx}',
                    'src/test/**',
                    'src/**/*.d.ts',
                    'src/main.tsx',
                ],
            },
        },
    })
);
```

Key decisions behind this config:

- **`globals: true`** exposes `describe`, `it`, `expect`, `vi` globally — matches the familiar Jest API and removes
  boilerplate imports. Pair with `"types": ["vitest/globals"]` in `tsconfig.json`.
- **`environment: 'jsdom'`** provides a browser-like DOM for component tests. For pure logic/utility tests that don't
  touch the DOM, override per-file with `// @vitest-environment node` at the top.
- **`setupFiles`** runs before every test file — used for `@testing-library/jest-dom` matchers and global cleanup.
- **`css: true`** processes CSS imports instead of ignoring them, catching missing class references.
- **`coverage.provider: 'v8'`** is fast and requires no extra binary. Switch to `'istanbul'` if you need more granular
  ignore comments.

### TypeScript Configuration

Add Vitest types to `tsconfig.json` (or a dedicated `tsconfig.test.json`) so globals are recognized:

```jsonc
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### Global Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import {cleanup} from '@testing-library/react';
import {afterEach, vi} from 'vitest';

// Automatic cleanup after each test (unmounts rendered components)
afterEach(() => {
    cleanup();
});

// Reset all mocks between tests to prevent leakage
afterEach(() => {
    vi.restoreAllMocks();
});

// Stub browser APIs not available in jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
```

## Writing Tests

### Guiding Principles

1. **Test behavior, not implementation.** Query by role, label, text, or placeholder — not by class name or internal
   state. Tests should survive a refactor that doesn't change user-facing behavior.
2. **Use `userEvent` over `fireEvent`.** `@testing-library/user-event` simulates real browser interaction (focus,
   keystrokes, pointer events) rather than dispatching synthetic events. This catches bugs that `fireEvent` misses.
3. **Keep tests focused.** One logical behavior per `it()` block. Name tests as sentences that describe what the user
   sees or what the function returns.
4. **Arrange–Act–Assert.** Structure every test clearly: set up state, perform the action, check the result. Blank lines
   between sections improve readability.
5. **Avoid testing implementation details.** Don't assert on internal state, private methods, or hook return shapes
   directly. Test the observable output — rendered DOM, returned values, or side effects.
6. **Mock at the boundary, not in the middle.** Mock HTTP clients, browser APIs, and external modules. Avoid mocking
   internal functions within the module under test.

### Custom Render with Providers

Most React apps wrap components in providers (Router, Theme, Auth, Store). Create a custom `render` that includes all of
them so tests don't each repeat this boilerplate:

```typescript
// src/test/test-utils.tsx
import {render, type RenderOptions} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {ThemeProvider} from '../providers/ThemeProvider';
import type {ReactElement} from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    route?: string;
}

function AllProviders({children}: { children: React.ReactNode }) {
    return (
        <BrowserRouter>
            <ThemeProvider>{children} < /ThemeProvider>
        < /BrowserRouter>
    );
}

function customRender(ui: ReactElement, options?: CustomRenderOptions) {
    if (options?.route) {
        window.history.pushState({}, '', options.route);
    }
    return render(ui, {wrapper: AllProviders, ...options});
}

// Re-export everything from RTL, overriding render
export * from '@testing-library/react';
export {customRender as render};
export {default as userEvent} from '@testing-library/user-event';
```

Import from `test-utils` instead of `@testing-library/react` in all component tests:

```typescript
import {render, screen, userEvent} from '../test/test-utils';
```

### Component Tests

```typescript
// src/components/Button/Button.test.tsx
import {render, screen, userEvent} from '../../test/test-utils';
import {Button} from './Button';

describe('Button', () => {
    it('renders the label text', () => {
        render(<Button label = "Save" / >);
        expect(screen.getByRole('button', {name: 'Save'})).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
        const handleClick = vi.fn();
        render(<Button label = "Save"
        onClick = {handleClick}
        />);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', {name: 'Save'}));

        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('is disabled when the disabled prop is true', () => {
        render(<Button label = "Save"
        disabled / >
    )
        ;
        expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled();
    });

    it('shows a loading spinner when loading', () => {
        render(<Button label = "Save"
        loading / >
    )
        ;
        expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
```

### Async Components (API Calls, Data Fetching)

Mock the API layer at the boundary — typically the `fetch` or Axios instance — and use `findBy*` queries that wait for
async updates:

```typescript
// src/components/UserList/UserList.test.tsx
import {render, screen} from '../../test/test-utils';
import {UserList} from './UserList';
import * as api from '../../services/api';

// Mock the module, not the global fetch
vi.mock('../../services/api');

const mockUsers = [
    {id: '1', name: 'Alice', email: 'alice@example.com'},
    {id: '2', name: 'Bob', email: 'bob@example.com'},
];

describe('UserList', () => {
    it('renders users after loading', async () => {
        vi.mocked(api.getUsers).mockResolvedValue(mockUsers);

        render(<UserList / >);

        // Shows loading state initially
        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        // Waits for async render — findBy* retries until timeout
        expect(await screen.findByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows an error message when the API fails', async () => {
        vi.mocked(api.getUsers).mockRejectedValue(new Error('Network error'));

        render(<UserList / >);

        expect(await screen.findByRole('alert')).toHaveTextContent(/failed to load/i);
    });
});
```

### Testing Custom Hooks

Use `renderHook` from Testing Library to test hooks in isolation. Wrap with providers if the hook depends on context:

```typescript
// src/hooks/useAuth.test.ts
import {renderHook, act, waitFor} from '../../test/test-utils';
import {useAuth} from './useAuth';

describe('useAuth', () => {
    it('starts in an unauthenticated state', () => {
        const {result} = renderHook(() => useAuth());
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBeNull();
    });

    it('sets user after successful login', async () => {
        const {result} = renderHook(() => useAuth());

        await act(async () => {
            await result.current.login('alice@example.com', 'password123');
        });

        await waitFor(() => {
            expect(result.current.isAuthenticated).toBe(true);
            expect(result.current.user?.email).toBe('alice@example.com');
        });
    });
});
```

### Testing Utility Functions

Pure logic tests don't need jsdom. Override the environment at the file level for faster execution:

```typescript
// @vitest-environment node
// src/utils/format.test.ts
import {formatCurrency, formatDate, slugify} from './format';

describe('formatCurrency', () => {
    it('formats USD with two decimal places', () => {
        expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
    });

    it('handles zero', () => {
        expect(formatCurrency(0, 'USD')).toBe('$0.00');
    });

    it('handles negative values', () => {
        expect(formatCurrency(-42.1, 'USD')).toBe('-$42.10');
    });
});

describe('slugify', () => {
    it.each([
        ['Hello World', 'hello-world'],
        ['  Extra   Spaces  ', 'extra-spaces'],
        ['Special @#$ Characters!', 'special-characters'],
        ['UPPERCASE', 'uppercase'],
    ])('converts "%s" to "%s"', (input, expected) => {
        expect(slugify(input)).toBe(expected);
    });
});
```

## Mocking Patterns

### Module Mocks

```typescript
// Mock an entire module — all exports become vi.fn()
vi.mock('../../services/api');

// Mock with a custom implementation
vi.mock('../../services/api', () => ({
    getUsers: vi.fn().mockResolvedValue([]),
    createUser: vi.fn().mockResolvedValue({id: '1'}),
}));

// Mock a default export
vi.mock('../../lib/analytics', () => ({
    default: {track: vi.fn(), identify: vi.fn()},
}));
```

### Partial Mocks (Keep Real Implementations)

```typescript
// Only mock specific exports, keep the rest real
vi.mock('../../utils/helpers', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../utils/helpers')>();
    return {
        ...actual,
        generateId: vi.fn().mockReturnValue('test-id-123'),
    };
});
```

### Mocking `fetch` / Global APIs

```typescript
// In a test or setup file
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Per-test setup
mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({data: 'test'}),
});
```

For projects using `fetch` extensively, consider **MSW (Mock Service Worker)** instead of manual `fetch` mocks. MSW
intercepts at the network level and works across all fetch wrappers without coupling tests to implementation:

```typescript
// src/test/mocks/handlers.ts
import {http, HttpResponse} from 'msw';

export const handlers = [
    http.get('/api/users', () => {
        return HttpResponse.json([
            {id: '1', name: 'Alice'},
            {id: '2', name: 'Bob'},
        ]);
    }),
];

// src/test/mocks/server.ts
import {setupServer} from 'msw/node';
import {handlers} from './handlers';

export const server = setupServer(...handlers);

// src/test/setup.ts (add to existing setup)
import {server} from './mocks/server';

beforeAll(() => server.listen({onUnhandledRequest: 'error'}));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Timers

```typescript
describe('debounced search', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls the API after the debounce delay', async () => {
        const onSearch = vi.fn();
        render(<SearchInput onSearch = {onSearch}
        debounceMs = {300}
        />);

        const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
        await user.type(screen.getByRole('searchbox'), 'react');

        // Not called yet — debounce hasn't elapsed
        expect(onSearch).not.toHaveBeenCalled();

        // Advance past debounce window
        await act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(onSearch).toHaveBeenCalledWith('react');
    });
});
```

Note the `advanceTimers` option passed to `userEvent.setup()` — this bridges user-event's internal timers with Vitest's
fake timers so `await user.type()` works correctly.

### Snapshot Tests

Use sparingly — only for stable, intentionally-designed output like serialized data structures or small UI fragments.
Avoid full-component snapshots since they break on every trivial markup change:

```typescript
it('renders the expected structure', () => {
    const {container} = render(<Icon name = "check"
    size = "lg" / >
)
    ;
    expect(container.firstChild).toMatchSnapshot();
});

// Prefer inline snapshots for small, focused assertions
it('serializes the config correctly', () => {
    expect(buildConfig({debug: true})).toMatchInlineSnapshot(`
    {
      "debug": true,
      "logLevel": "verbose",
      "output": "console",
    }
  `);
});
```

## Running Tests

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:related": "vitest related"
  }
}
```

Commonly used CLI flags:

- `vitest` — starts in watch mode by default (re-runs on file changes)
- `vitest run` — single run, exits after completion (use in CI)
- `vitest run src/components/Button` — runs only tests matching the path
- `vitest run --reporter=verbose` — shows every individual test name
- `vitest --ui` — opens a browser-based UI for exploring test results

## Dependencies

Minimum required packages:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Optional but recommended:

```bash
# Coverage
npm install -D @vitest/coverage-v8

# Browser-based test UI
npm install -D @vitest/ui

# MSW for network-level mocking
npm install -D msw
```

## CI/CD Integration

```yaml
# .github/workflows/unit-tests.yml
name: Unit Tests
on: [ push, pull_request ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run unit tests
        run: npx vitest run --coverage --reporter=default --reporter=junit --outputFile=test-results/junit.xml

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
          retention-days: 14

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 14
```

## Maintaining Tests

### When the User Adds a New Component

1. Ask what the component does, its props, and key states (loading, error, empty).
2. Create a co-located `.test.tsx` file next to the component.
3. Write tests for: default render, each prop variation, user interactions, and error/edge cases.
4. If the component calls an API or uses context, mock the boundary layer.
5. Run `vitest run --coverage` to verify the new code is covered.

### When a Test is Failing

Diagnose before fixing:

1. Run the single test in isolation: `vitest run src/path/to/File.test.tsx`.
2. Check if it's an environment issue — does the test use DOM APIs? If so, verify `environment: 'jsdom'` is set.
3. Common culprits:
    - **Stale mocks**: A previous test's mock leaked. Ensure `vi.restoreAllMocks()` is in `afterEach` (the setup file
      should handle this).
    - **Async timing**: Using `getBy*` for content that appears after a state update. Switch to `findBy*` or wrap
      assertions in `waitFor()`.
    - **Missing provider**: Component uses a context (Router, Theme, Auth) not included in the test render. Use the
      custom `render` from `test-utils.tsx`.
    - **Import alias mismatch**: Vite alias like `@/` not resolving in tests. Ensure `vitest.config.ts` inherits from
      `vite.config.ts` via `mergeConfig`.
    - **Act warnings**: State update happened outside an `act()` boundary. Wrap the triggering action in `act()` or use
      `userEvent` which handles this internally.
4. Fix the root cause. Never suppress a test failure by loosening the assertion unless the original assertion was wrong.

### When Refactoring Components

1. Run the existing tests first to confirm they pass — this is your safety net.
2. Refactor the component.
3. Run tests again. If tests break because they relied on implementation details (internal class names, hook internals),
   fix the tests to assert on behavior instead.
4. Tests that break because user-visible behavior changed are legitimate failures — update the tests to match the new
   expected behavior.

## Checklist for Every Test Change

Before committing, verify:

- [ ] Tests pass: `npx vitest run`
- [ ] No `.only` or `.skip` left in code
- [ ] No hardcoded absolute paths or environment-specific values
- [ ] `vi.restoreAllMocks()` is in the shared setup (not manually in each test)
- [ ] Async tests use `findBy*` or `waitFor`, never `setTimeout`
- [ ] New test files are co-located next to the source file they test
- [ ] Custom render from `test-utils.tsx` is used for component tests
- [ ] Coverage has not regressed: `npx vitest run --coverage`

## Troubleshooting Quick Reference

| Symptom                                                      | Likely Cause                                        | Fix                                                                                    |
|--------------------------------------------------------------|-----------------------------------------------------|----------------------------------------------------------------------------------------|
| `ReferenceError: document is not defined`                    | Missing jsdom environment                           | Add `environment: 'jsdom'` to config or `// @vitest-environment jsdom` at file top     |
| `TypeError: expect(...).toBeInTheDocument is not a function` | jest-dom matchers not loaded                        | Verify `@testing-library/jest-dom/vitest` is imported in setup file                    |
| `Warning: An update was not wrapped in act(...)`             | State update outside act boundary                   | Use `userEvent` (auto-wraps) or wrap action in `act()`                                 |
| Test passes alone, fails in suite                            | Mock leaking between tests                          | Ensure `vi.restoreAllMocks()` in `afterEach`; check module-level mocks                 |
| Import alias `@/` not found                                  | Vitest not inheriting Vite aliases                  | Use `mergeConfig` with `vite.config.ts` in vitest config                               |
| CSS module imports fail                                      | CSS processing disabled                             | Set `css: true` in test config                                                         |
| `vi.mock` not hoisting correctly                             | Mock placed inside a function                       | Move `vi.mock()` calls to the top level of the file — Vitest hoists them automatically |
| Coverage shows 0% for tested files                           | Coverage `include` pattern doesn't match file paths | Check `coverage.include` globs match your `src/` structure                             |
| `userEvent.type` hangs with fake timers                      | Timer bridge missing                                | Pass `{ advanceTimers: vi.advanceTimersByTime }` to `userEvent.setup()`                |
