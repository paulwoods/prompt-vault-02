import {expect, test} from '../../fixtures/base';
import {AppPage} from '../../pages/AppPage';
import {PromptEditorPage} from '../../pages/PromptEditorPage';
import {apiCreatePrompt, apiDeletePrompt} from '../../helpers/api';
import {uniqueName} from '../../helpers/data-factory';

test.describe('Prompts', () => {
    test('empty state is shown when no prompts exist', async ({freshUserPage}) => {
        const app = new AppPage(freshUserPage);
        await expect(app.emptyState).toBeVisible();
        await expect(freshUserPage.getByText('Create your first prompt')).toBeVisible();
    });

    test('create your first prompt link opens editor', async ({freshUserPage}) => {
        await freshUserPage.getByText('Create your first prompt').click();
        const editor = new PromptEditorPage(freshUserPage);
        await expect(editor.titleInput).toBeVisible();
    });

    test('clicking + New opens the editor with default title', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await app.createPrompt();
        const editor = new PromptEditorPage(authedPage);
        await expect(editor.titleInput).toBeVisible();
        await expect(editor.saveButton).toBeVisible();
    });

    test('can save a prompt with a custom title', async ({authedPage, request}) => {
        const title = uniqueName('My Prompt');
        const app = new AppPage(authedPage);
        await app.createPrompt();

        const editor = new PromptEditorPage(authedPage);
        await editor.setTitle(title);
        await editor.typeInEditor('This is the body of my prompt.');
        await editor.save();

        // Status bar should show saved state
        await expect(editor.savedBadge).toBeVisible();

        // Go back and verify prompt appears in the list
        await editor.clickBack();
        await expect(app.promptItem(title)).toBeVisible();
    });

    test('prompt list shows created prompt', async ({authedPage, request}) => {
        const title = uniqueName('Listed Prompt');
        const prompt = await apiCreatePrompt(request, {
            title,
            currentBody: '<p>Body text</p>',
        });

        // Reload to pick up the new prompt
        await authedPage.reload();
        const app = new AppPage(authedPage);
        await expect(app.promptItem(title)).toBeVisible();

        // Cleanup
        await apiDeletePrompt(request, prompt.id);
    });

    test('clicking a prompt in the list opens the editor', async ({authedPage, request}) => {
        const title = uniqueName('Click Me');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>hello</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await expect(editor.titleInput).toHaveValue(title);

        await apiDeletePrompt(request, prompt.id);
    });

    test('back button returns to prompt list', async ({authedPage, request}) => {
        const title = uniqueName('Back Test');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.clickBack();

        await expect(app.searchInput).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('unsaved changes badge appears after editing title', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await app.createPrompt();

        const editor = new PromptEditorPage(authedPage);
        await editor.setTitle('Changed Title');
        await expect(editor.unsavedBadge).toBeVisible();
    });

    test('preview tab renders the prompt body', async ({authedPage, request}) => {
        const title = uniqueName('Preview Test');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>Hello world</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToPreview();
        await expect(authedPage.getByText('Hello world')).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('unsaved changes modal appears when closing with dirty state', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await app.createPrompt();

        const editor = new PromptEditorPage(authedPage);
        await editor.setTitle('Dirty Title');
        await editor.clickBack();

        await expect(authedPage.getByText(/unsaved changes/i)).toBeVisible();
    });

    test('discard in unsaved changes modal closes without saving', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await app.createPrompt();

        const editor = new PromptEditorPage(authedPage);
        await editor.setTitle('Should Not Save');
        await editor.clickBack();

        await authedPage.getByRole('button', {name: 'Discard'}).click();
        // Should be back at prompt list
        await expect(app.searchInput).toBeVisible();
    });

    test('cancel in unsaved changes modal stays in editor', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await app.createPrompt();

        const editor = new PromptEditorPage(authedPage);
        await editor.setTitle('Staying');
        await editor.clickBack();

        await authedPage.getByRole('button', {name: 'Cancel'}).click();
        // Should still be in editor
        await expect(editor.saveButton).toBeVisible();
    });

    test('save and close in unsaved modal saves and returns to list', async ({authedPage}) => {
        const title = uniqueName('Save And Close');
        const app = new AppPage(authedPage);
        await app.createPrompt();

        const editor = new PromptEditorPage(authedPage);
        await editor.setTitle(title);
        await editor.clickBack();

        await authedPage.getByRole('button', {name: /save/i}).first().click();
        // Returns to list and prompt is there
        await expect(app.promptItem(title)).toBeVisible({timeout: 10_000});
    });
});
