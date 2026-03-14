import {Page} from '@playwright/test';

export async function loginViaUI(
    page: Page,
    email: string,
    password: string,
): Promise<void> {
    await page.goto('/');
    await page.getByRole('button', {name: 'Get started'}).click();
    await page.getByPlaceholder('you@company.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', {name: 'Sign in now'}).click();
    // Wait until the app shell is visible (header with user email)
    await page.waitForSelector('header', {timeout: 10_000});
}

export async function logoutViaUI(page: Page): Promise<void> {
    await page.getByRole('button', {name: 'Sign out'}).click();
}

export const TEST_EMAIL = process.env.PV_TEST_USER_EMAIL || 'e2e-test@example.com';
export const TEST_PASSWORD = process.env.PV_TEST_USER_PASSWORD || 'Password123!';
