import {type Locator, type Page} from '@playwright/test';

export class AuthPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly confirmPasswordInput: Locator;
    readonly signInTab: Locator;
    readonly createAccountTab: Locator;
    readonly submitButton: Locator;
    readonly errorMessage: Locator;
    readonly forgotPasswordLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByPlaceholder('you@company.com');
        this.passwordInput = page.getByPlaceholder('••••••••').first();
        this.confirmPasswordInput = page.getByPlaceholder('••••••••').last();
        this.signInTab = page.getByRole('button', {name: 'Sign in'}).first();
        this.createAccountTab = page.getByRole('button', {name: 'Create account'}).first();
        this.submitButton = page.getByRole('button', {name: /^(Sign in|Create account)$/});
        this.errorMessage = page.locator('[style*="color: var(--color-danger)"]').first();
        this.forgotPasswordLink = page.getByRole('button', {name: 'Forgot password?'});
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    async register(email: string, password: string) {
        await this.createAccountTab.click();
        await this.emailInput.fill(email);
        // After switching to register mode, placeholders change
        await this.page.getByPlaceholder('At least 8 characters').fill(password);
        await this.confirmPasswordInput.fill(password);
        await this.submitButton.click();
    }

    async switchToRegister() {
        await this.createAccountTab.click();
    }

    async switchToLogin() {
        await this.signInTab.click();
    }
}
