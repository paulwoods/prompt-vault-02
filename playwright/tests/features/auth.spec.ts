import {expect, test} from '@playwright/test';
import {HomePage} from '../../pages/HomePage';
import {AuthPage} from '../../pages/AuthPage';
import {AppPage} from '../../pages/AppPage';
import {TEST_PASSWORD, uniqueEmail} from '../../helpers/data-factory';
import {apiRegister} from '../../helpers/api';

test.describe('Authentication', () => {
    test('home page shows Get started and Sign in buttons', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await expect(home.getStartedButton).toBeVisible();
        await expect(home.signInLink).toBeVisible();
    });

    test('Get started navigates to auth page with login tab active', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await home.clickGetStarted();
        await expect(page.getByRole('heading', {name: 'Welcome back'})).toBeVisible();
    });

    test('Sign in nav link navigates to auth page', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await home.clickSignIn();
        await expect(page.getByRole('heading', {name: 'Welcome back'})).toBeVisible();
    });

    test('switching to register tab shows Create your account heading', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await home.clickGetStarted();

        const auth = new AuthPage(page);
        await auth.switchToRegister();
        await expect(page.getByRole('heading', {name: 'Create your account'})).toBeVisible();
        await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible();
    });

    test('register tab shows confirm password field', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        const auth = new AuthPage(page);
        await auth.switchToRegister();
        await expect(page.getByLabel('Confirm password')).toBeVisible();
    });

    test('successful registration lands on the app', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        const auth = new AuthPage(page);
        const email = uniqueEmail();
        await auth.register(email, TEST_PASSWORD);
        const app = new AppPage(page);
        await expect(app.signOutButton).toBeVisible({timeout: 10_000});
    });

    test('successful login lands on the app', async ({page, request}) => {
        const email = uniqueEmail();
        await apiRegister(request, email, TEST_PASSWORD);

        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        const auth = new AuthPage(page);
        await auth.login(email, TEST_PASSWORD);

        const app = new AppPage(page);
        await expect(app.signOutButton).toBeVisible({timeout: 10_000});
    });

    test('login with wrong password shows error', async ({page, request}) => {
        const email = uniqueEmail();
        await apiRegister(request, email, TEST_PASSWORD);

        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        const auth = new AuthPage(page);
        await auth.login(email, 'WrongPassword999!');

        await expect(page.getByText('Invalid email or password')).toBeVisible();
    });

    test('register with mismatched passwords shows error', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        const auth = new AuthPage(page);
        await auth.switchToRegister();
        await auth.emailInput.fill(uniqueEmail());
        await page.getByPlaceholder('At least 8 characters').fill('Password123!');
        await auth.confirmPasswordInput.fill('DifferentPassword!');
        await auth.submitButton.click();
        await expect(page.getByText('Passwords do not match.')).toBeVisible();
    });

    test('register with short password shows error', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        const auth = new AuthPage(page);
        await auth.switchToRegister();
        await auth.emailInput.fill(uniqueEmail());
        await page.getByPlaceholder('At least 8 characters').fill('short');
        await auth.confirmPasswordInput.fill('short');
        await auth.submitButton.click();
        await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
    });

    test('sign out returns to home page', async ({page, request}) => {
        const email = uniqueEmail();
        await apiRegister(request, email, TEST_PASSWORD);
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        const auth = new AuthPage(page);
        await auth.login(email, TEST_PASSWORD);

        const app = new AppPage(page);
        await expect(app.signOutButton).toBeVisible({timeout: 10_000});
        await app.signOutButton.click();

        const home = new HomePage(page);
        await expect(home.getStartedButton).toBeVisible({timeout: 10_000});
    });

    test('Prompt Vault logo in auth nav navigates back to home', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        await expect(page.getByRole('heading', {name: 'Welcome back'})).toBeVisible();
        // Click the logo button (contains "Prompt Vault")
        await page.getByRole('button', {name: 'Prompt Vault'}).click();
        await expect(page.getByRole('heading', {name: /Store, version, and search/i})).toBeVisible();
    });

    test('forgot password link navigates to forgot password page', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        await page.getByRole('button', {name: 'Forgot password?'}).click();
        await expect(page.getByRole('heading', {name: 'Reset your password'})).toBeVisible();
    });

    test('forgot password page shows confirmation after submit', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        await page.getByRole('button', {name: 'Forgot password?'}).click();

        await page.getByPlaceholder('you@company.com').fill('someone@example.com');
        await page.getByRole('button', {name: 'Send reset link'}).click();
        await expect(page.getByRole('heading', {name: 'Check your email'})).toBeVisible({timeout: 10_000});
    });

    test('back to sign in from forgot password page', async ({page}) => {
        await page.goto('/');
        await page.getByRole('button', {name: 'Get started'}).click();
        await page.getByRole('button', {name: 'Forgot password?'}).click();
        await page.getByRole('button', {name: 'Back to sign in'}).click();
        await expect(page.getByRole('heading', {name: 'Welcome back'})).toBeVisible();
    });
});
