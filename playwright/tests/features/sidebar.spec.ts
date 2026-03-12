import {expect, test} from '../../fixtures/base';
import {AppPage} from '../../pages/AppPage';

test.describe('Sidebar', () => {
    test('sidebar is visible by default', async ({authedPage}) => {
        await expect(authedPage.getByText('Prompt Vault').first()).toBeVisible();
        await expect(authedPage.getByText('Folders', {exact: true}).first()).toBeVisible();
        await expect(authedPage.getByText('Tags', {exact: true}).first()).toBeVisible();
    });

    test('collapse button hides sidebar content', async ({authedPage}) => {
        // Click the collapse button (the chevron icon button in sidebar header)
        const collapseBtn = authedPage.getByTitle(/Collapse sidebar/i);
        await collapseBtn.click();

        // Folders and Tags sections should no longer be visible
        await expect(authedPage.getByText('Folders', {exact: true}).first()).not.toBeVisible();
        await expect(authedPage.getByText('Tags', {exact: true}).first()).not.toBeVisible();
    });

    test('expand button restores sidebar content', async ({authedPage}) => {
        const collapseBtn = authedPage.getByTitle(/Collapse sidebar/i);
        await collapseBtn.click();

        // Now click the expand button
        const expandBtn = authedPage.getByTitle(/Expand sidebar/i);
        await expandBtn.click();

        await expect(authedPage.getByText('Folders', {exact: true}).first()).toBeVisible();
        await expect(authedPage.getByText('Tags', {exact: true}).first()).toBeVisible();
    });

    test('header shows logged-in user email', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        const emailText = await app.userEmail.textContent();
        // Email should contain @
        expect(emailText).toContain('@');
    });

    test('keyboard shortcut hint is shown in header', async ({authedPage}) => {
        // The header contains shortcut hints for new prompt and sidebar toggle
        await expect(authedPage.locator('header').getByText(/new/i)).toBeVisible();
        await expect(authedPage.locator('header').getByText(/sidebar/i)).toBeVisible();
    });
});
