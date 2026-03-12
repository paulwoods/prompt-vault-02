import {type Locator, type Page} from '@playwright/test';

/** The main authenticated app shell (sidebar + prompt list). */
export class AppPage {
    readonly page: Page;
    readonly userEmail: Locator;
    readonly signOutButton: Locator;
    readonly searchInput: Locator;
    readonly newPromptButton: Locator;
    readonly promptList: Locator;
    readonly emptyState: Locator;

    // Sidebar
    readonly allPromptsButton: Locator;
    readonly newFolderButton: Locator;
    readonly newTagButton: Locator;
    readonly folderNameInput: Locator;
    readonly tagNameInput: Locator;

    constructor(page: Page) {
        this.page = page;
        this.userEmail = page.locator('header span').first();
        this.signOutButton = page.getByRole('button', {name: 'Sign out'});
        this.searchInput = page.getByPlaceholder('Search prompts…');
        this.newPromptButton = page.getByRole('button', {name: '+ New'});
        this.promptList = page.locator('ul.space-y-2');
        this.emptyState = page.getByText('No prompts yet.');

        this.allPromptsButton = page.getByRole('button', {name: 'All Prompts'});
        this.newFolderButton = page.getByRole('button', {name: '+ New Folder'});
        this.newTagButton = page.getByRole('button', {name: '+ New Tag'});
        this.folderNameInput = page.getByPlaceholder('Folder name...');
        this.tagNameInput = page.getByPlaceholder('Tag name...');
    }

    async createPrompt(): Promise<void> {
        await this.newPromptButton.click();
    }

    async clickPrompt(title: string): Promise<void> {
        await this.page.getByText(title).click();
    }

    async searchFor(query: string): Promise<void> {
        await this.searchInput.fill(query);
    }

    async clearSearch(): Promise<void> {
        await this.searchInput.clear();
    }

    async createFolder(name: string): Promise<void> {
        await this.newFolderButton.click();
        await this.folderNameInput.fill(name);
        await this.folderNameInput.press('Enter');
    }

    async createTag(name: string): Promise<void> {
        await this.newTagButton.click();
        await this.tagNameInput.fill(name);
        await this.tagNameInput.press('Enter');
    }

    async clickFolder(name: string): Promise<void> {
        await this.page.getByRole('button', {name}).click();
    }

    async clickTag(name: string): Promise<void> {
        await this.page.getByRole('button', {name: `#${name}`}).click();
    }

    promptItem(title: string): Locator {
        return this.page.locator('li').filter({hasText: title});
    }
}
