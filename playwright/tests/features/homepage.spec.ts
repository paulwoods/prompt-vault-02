import {expect, test} from '@playwright/test';
import {HomePage} from '../../pages/HomePage';

test.describe('Home Page', () => {
    test('displays all four feature cards', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await expect(page.getByText('Prompt Library')).toBeVisible();
        await expect(page.getByText('Version History')).toBeVisible();
        await expect(page.getByText('Full-Text Search')).toBeVisible();
        await expect(page.getByText('Share & Collaborate')).toBeVisible();
    });

    test('displays hero headline', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await expect(home.heroHeading).toBeVisible();
    });

    test('displays stats bar content', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await expect(page.getByText('Per prompt, fully tracked')).toBeVisible();
        await expect(page.getByText('Private by default')).toBeVisible();
    });

    test('Open Vault button navigates to auth page', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await home.openVaultButton.click();
        await expect(page.getByRole('heading', {name: 'Welcome back'})).toBeVisible();
    });

    test('See features anchor scrolls to feature section', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await page.getByRole('link', {name: 'See features →'}).click();
        await expect(page.locator('#features')).toBeVisible();
    });

    test('Open Prompt Vault CTA button navigates to auth page', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await home.openPromptVaultButton.click();
        await expect(page.getByRole('heading', {name: 'Welcome back'})).toBeVisible();
    });

    test('footer displays copyright text', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await expect(page.getByText(/Prompt Vault/)).toBeVisible();
        await expect(page.getByText('Built for teams who build with AI.')).toBeVisible();
    });
});
