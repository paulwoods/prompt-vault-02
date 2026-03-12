import {type Locator, type Page} from '@playwright/test';

export class HomePage {
    readonly page: Page;
    readonly getStartedButton: Locator;
    readonly signInLink: Locator;
    readonly openVaultButton: Locator;
    readonly openPromptVaultButton: Locator;
    readonly featureCards: Locator;
    readonly heroHeading: Locator;

    constructor(page: Page) {
        this.page = page;
        this.getStartedButton = page.getByRole('button', {name: 'Get started'});
        this.signInLink = page.getByRole('button', {name: 'Sign in'}).first();
        this.openVaultButton = page.getByRole('button', {name: 'Open Vault'});
        this.openPromptVaultButton = page.getByRole('button', {name: 'Open Prompt Vault'});
        this.featureCards = page.locator('#features .grid > div');
        this.heroHeading = page.getByRole('heading', {name: /Store, version, and search/i});
    }

    async goto() {
        await this.page.goto('/');
    }

    async clickGetStarted() {
        await this.getStartedButton.click();
    }

    async clickSignIn() {
        await this.signInLink.click();
    }
}
