import {expect, test} from '../../fixtures/base';
import {HomePage} from '../../pages/HomePage';
import {AppPage} from '../../pages/AppPage';

test.describe('Smoke @smoke', () => {
    test('home page loads and displays hero content', async ({page}) => {
        const home = new HomePage(page);
        await home.goto();
        await expect(home.heroHeading).toBeVisible();
        await expect(home.getStartedButton).toBeVisible();
        await expect(home.featureCards).toHaveCount(4);
    });

    test('authenticated user sees the app shell @smoke', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await expect(app.signOutButton).toBeVisible();
        await expect(app.searchInput).toBeVisible();
        await expect(app.newPromptButton).toBeVisible();
        await expect(app.allPromptsButton).toBeVisible();
    });

    test('creating a new prompt opens the editor @smoke', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await app.createPrompt();
        await expect(authedPage.getByPlaceholder('Untitled prompt')).toBeVisible();
        await expect(authedPage.getByRole('button', {name: 'Save'})).toBeVisible();
    });
});
