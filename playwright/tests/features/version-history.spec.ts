import {expect, test} from '../../fixtures/base';
import {AppPage} from '../../pages/AppPage';
import {PromptEditorPage} from '../../pages/PromptEditorPage';
import {apiCreatePrompt, apiDeletePrompt} from '../../helpers/api';
import {uniqueName} from '../../helpers/data-factory';

test.describe('Version History', () => {
    test('History tab is visible in the editor', async ({authedPage, request}) => {
        const title = uniqueName('VersionPrompt');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>v1</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await expect(editor.historyTab).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('switching to History tab shows Versions header', async ({authedPage, request}) => {
        const title = uniqueName('HistoryView');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>v1</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToHistory();

        await expect(authedPage.getByText('Versions')).toBeVisible();
        await expect(authedPage.getByText('Select a version to compare')).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('history shows at least one version after save', async ({authedPage, request}) => {
        const title = uniqueName('SavedVersion');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>v1</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToHistory();

        await expect(authedPage.getByText('Latest')).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('selecting a version in history shows diff pane', async ({authedPage, request}) => {
        const title = uniqueName('DiffTest');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>version one</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToHistory();

        // Click the Latest version item to select it
        await authedPage.getByText('Latest').click();

        await expect(authedPage.getByRole('button', {name: 'Restore this version'})).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });
});
