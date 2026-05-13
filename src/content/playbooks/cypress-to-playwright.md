---
from: "Cypress"
to: "Playwright"
category: "frontend"
tags: ["e2e", "testing", "cypress", "playwright"]
description: "Replace Cypress with Playwright for cross-browser end-to-end testing with async/await."
draft: false
---

# Cypress → Playwright

## Philosophy shift

Cypress runs inside the browser using its own command queue — async operations are chained, not awaited. Playwright runs outside the browser over a protocol, using standard `async/await`. Tests feel like regular Node.js code.

**Rule:** Every Cypress command that implicitly retries has a Playwright `locator` equivalent. Don't reach for `waitForSelector` when `locator.click()` already auto-waits.

## Setup

Remove Cypress:
```bash
npm uninstall cypress
```

Install Playwright:
```bash
npm init playwright@latest
```

This scaffolds `playwright.config.ts`, `tests/`, and installs browser binaries.

## Core transformations

### Test structure

```ts
// Cypress
describe('Login', () => {
  beforeEach(() => { cy.visit('/login'); });

  it('submits the form', () => {
    cy.get('[data-testid="email"]').type('user@example.com');
    cy.get('[data-testid="password"]').type('secret');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});

// Playwright
import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/login'); });

  test('submits the form', async ({ page }) => {
    await page.getByTestId('email').fill('user@example.com');
    await page.getByTestId('password').fill('secret');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

### Querying elements

```ts
// Cypress
cy.get('[data-testid="title"]')
cy.get('button').contains('Save')
cy.get('input[placeholder="Search"]')
cy.get('.nav-link').first()

// Playwright
page.getByTestId('title')
page.getByRole('button', { name: 'Save' })
page.getByPlaceholder('Search')
page.locator('.nav-link').first()
```

### Assertions

```ts
// Cypress
cy.get('h1').should('have.text', 'Welcome');
cy.get('.error').should('be.visible');
cy.get('input').should('have.value', 'hello');
cy.get('[data-testid="list"]').children().should('have.length', 3);
cy.url().should('include', '/home');
cy.title().should('eq', 'My App');

// Playwright
await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome');
await expect(page.locator('.error')).toBeVisible();
await expect(page.locator('input')).toHaveValue('hello');
await expect(page.getByTestId('list').locator('> *')).toHaveCount(3);
await expect(page).toHaveURL(/\/home/);
await expect(page).toHaveTitle('My App');
```

### Network interception

```ts
// Cypress
cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
cy.wait('@getUsers');

// Playwright
await page.route('/api/users', route =>
  route.fulfill({ path: 'fixtures/users.json' })
);
// No explicit wait needed — Playwright auto-waits for network idle
```

### Fixtures

```ts
// Cypress
cy.fixture('user.json').then(user => { ... });

// Playwright — load directly
import userData from '../fixtures/user.json';
// or via test fixture
test('...', async ({ page }) => {
  const user = JSON.parse(await readFile('fixtures/user.json', 'utf-8'));
});
```

### Custom commands → fixtures/helpers

```ts
// Cypress custom command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email"]').type(email);
  cy.get('[data-testid="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Playwright — plain async function or fixture
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByRole('button', { name: /submit/i }).click();
}

// Or use storageState for auth bypass (much faster)
// playwright.config.ts
use: { storageState: 'playwright/.auth/user.json' }
```

### Aliases

```ts
// Cypress
cy.get('table').as('dataTable');
cy.get('@dataTable').find('tr').should('have.length', 5);

// Playwright — just use a variable
const table = page.locator('table');
await expect(table.locator('tr')).toHaveCount(5);
```

### Screenshots

```ts
// Cypress
cy.screenshot('my-screenshot');

// Playwright
await page.screenshot({ path: 'screenshots/my-screenshot.png' });
```

## Config

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## When NOT to migrate

- Heavy investment in Cypress-only plugins (`cypress-axe`, `percy-cypress`) without equivalents.
- Team uses Cypress Cloud features (parallelization, recording dashboard) and switching cost > benefit.
- Tests require running inside the browser context — Cypress runs in-browser; Playwright runs out-of-process.

## Pitfalls

- **Cypress commands auto-retry; Playwright locators auto-wait** — but `page.locator()` only waits when you perform an action or assertion. Storing a locator does not trigger a wait.
- **No `cy.wait(n)` equivalent** — replace time-based waits with `waitForResponse`, `waitForLoadState`, or assertion retries.
- **`cy.intercept` stubs fire once by default** — Playwright's `page.route` persists until `route.unroute()` or the page closes.
- **Cypress runs serially by default** — Playwright runs tests in parallel. Shared state (DB, auth) must be isolated per worker.
- **`cy.visit` is absolute or relative to `baseUrl`** — Playwright's `page.goto` follows the same pattern with `baseURL` in config.
- **Custom commands don't exist** — extract helpers as plain async functions or Playwright fixtures.

## Validation checklist

- [ ] No `cy.*` calls remaining
- [ ] All tests use `async/await`
- [ ] `cy.visit` → `page.goto`; `cy.get` → `page.locator` or semantic getters
- [ ] `cy.intercept` → `page.route`
- [ ] Custom commands extracted to plain functions or Playwright fixtures
- [ ] `playwright.config.ts` defines projects (browsers) and `webServer`
- [ ] CI updated to run `npx playwright test` (no `cypress run` references)

## Codemod references

- No production-grade automated codemod — handler API differs structurally.
- [Playwright's migration guide](https://playwright.dev/docs/migration) — authoritative mappings; pair with AI for actual conversion.

## AI Prompt

```
You are migrating an end-to-end test file from Cypress to Playwright.

Rules:
1. Replace `cy.get(selector)` with `page.locator(selector)` or semantic locators (getByRole, getByTestId, getByPlaceholder).
2. Replace `.should(...)` assertions with `await expect(locator).toMatcher(...)`.
3. Add `async/await` to all test functions and beforeEach hooks.
4. Replace `cy.intercept` with `page.route`.
5. Replace `cy.visit` with `await page.goto`.
6. Replace Cypress custom commands with plain async helper functions.
7. Wrap tests in `test(...)` and groups in `test.describe(...)` from `@playwright/test`.

Migrate the following Cypress test file:
```

## References

- [Playwright docs](https://playwright.dev/docs/intro)
- [Cypress → Playwright migration guide](https://playwright.dev/docs/migration)
- [Playwright locators](https://playwright.dev/docs/locators)
