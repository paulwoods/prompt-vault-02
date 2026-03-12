import {type Locator, type Page} from '@playwright/test';

export class PromptEditorPage {
    readonly page: Page;
    readonly backButton: Locator;
    readonly titleInput: Locator;
    readonly saveButton: Locator;
    readonly editTab: Locator;
    readonly previewTab: Locator;
    readonly historyTab: Locator;
    readonly shareTab: Locator;
    readonly editor: Locator;
    readonly statusBar: Locator;
    readonly saveError: Locator;
    readonly unsavedBadge: Locator;
    readonly savedBadge: Locator;

    constructor(page: Page) {
        this.page = page;
        this.backButton = page.getByRole('button', {name: 'Back'});
        this.titleInput = page.getByPlaceholder('Untitled prompt');
        this.saveButton = page.getByRole('button', {name: /^(Save|Saving…)$/});
        this.editTab = page.getByRole('button', {name: 'Edit'});
        this.previewTab = page.getByRole('button', {name: 'Preview'});
        this.historyTab = page.getByRole('button', {name: 'History'});
        this.shareTab = page.getByRole('button', {name: 'Share'});
        this.editor = page.locator('.ProseMirror');
        this.statusBar = page.locator('[class*="shrink-0"]').filter({hasText: /Unsaved|All changes saved/});
        this.unsavedBadge = page.getByText('● Unsaved changes');
        this.savedBadge = page.getByText('All changes saved');
        this.saveError = page.locator('[style*="color: var(--color-danger)"]').first();
    }

    async setTitle(title: string): Promise<void> {
        await this.titleInput.clear();
        await this.titleInput.fill(title);
    }

    async typeInEditor(text: string): Promise<void> {
        await this.editor.click();
        await this.editor.fill(text);
    }

    async save(): Promise<void> {
        await this.saveButton.click();
        await this.page.waitForFunction(() => {
            const btn = document.querySelector('button[class*="rounded-md"]');
            return btn?.textContent?.includes('Save') && !btn?.textContent?.includes('Saving');
        });
    }

    async clickBack(): Promise<void> {
        await this.backButton.click();
    }

    async switchToPreview(): Promise<void> {
        await this.previewTab.click();
    }

    async switchToHistory(): Promise<void> {
        await this.historyTab.click();
    }

    async switchToShare(): Promise<void> {
        await this.shareTab.click();
    }
}
