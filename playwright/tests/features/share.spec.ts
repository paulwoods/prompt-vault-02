import {expect, test} from '../../fixtures/base';
import {AppPage} from '../../pages/AppPage';
import {PromptEditorPage} from '../../pages/PromptEditorPage';
import {apiCreatePrompt, apiCreateShareLink, apiDeletePrompt} from '../../helpers/api';
import {uniqueName} from '../../helpers/data-factory';

test.describe('Share Panel', () => {
    test('Share tab is visible in the editor', async ({authedPage, request}) => {
        const title = uniqueName('SharePrompt');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>to share</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await expect(editor.shareTab).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('Share panel shows Share Links heading and new link button', async ({authedPage, request}) => {
        const title = uniqueName('SharePanel');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToShare();

        await expect(authedPage.getByText('Share Links')).toBeVisible();
        await expect(authedPage.getByRole('button', {name: '+ New link'})).toBeVisible();
        await expect(authedPage.getByText('Anyone with the link can view this prompt')).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('empty share panel shows no links message', async ({authedPage, request}) => {
        const title = uniqueName('NoLinks');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToShare();

        await expect(authedPage.getByText('No share links yet.')).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('creating a share link shows the link in the panel', async ({authedPage, request}) => {
        const title = uniqueName('CreateLink');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToShare();

        await authedPage.getByRole('button', {name: '+ New link'}).click();

        // A share URL containing /share/ should appear
        await expect(authedPage.getByText(/\/share\//)).toBeVisible({timeout: 10_000});
        await expect(authedPage.getByRole('button', {name: 'Copy'})).toBeVisible();
        await expect(authedPage.getByRole('button', {name: 'Revoke'})).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });

    test('revoking a share link removes it from the panel', async ({authedPage, request}) => {
        const title = uniqueName('RevokeLink');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToShare();

        // Create a link first
        await authedPage.getByRole('button', {name: '+ New link'}).click();
        await expect(authedPage.getByRole('button', {name: 'Revoke'})).toBeVisible({timeout: 10_000});

        // Revoke it
        await authedPage.getByRole('button', {name: 'Revoke'}).click();
        await expect(authedPage.getByText('No share links yet.')).toBeVisible({timeout: 10_000});

        await apiDeletePrompt(request, prompt.id);
    });

    test('share panel has email share section', async ({authedPage, request}) => {
        const title = uniqueName('EmailShare');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickPrompt(title);

        const editor = new PromptEditorPage(authedPage);
        await editor.switchToShare();

        await expect(authedPage.getByText('Share via email')).toBeVisible();
        await expect(authedPage.getByPlaceholder('recipient@example.com')).toBeVisible();
        await expect(authedPage.getByRole('button', {name: 'Send'})).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });
});

test.describe('Public Share Page', () => {
    test('valid share link shows prompt title and body', async ({page, request}) => {
        // We need to create a user, login, create a prompt, and create a share link
        // Use the API directly via the request context
        const {
            apiRegister,
            apiLogin,
            apiCreatePrompt: createP,
            apiCreateShareLink: createSL
        } = await import('../../helpers/api');
        const {uniqueEmail, TEST_PASSWORD} = await import('../../helpers/data-factory');

        const email = uniqueEmail();
        await apiRegister(request, email, TEST_PASSWORD);
        await apiLogin(request, email, TEST_PASSWORD);

        const title = uniqueName('PublicTitle');
        const prompt = await createP(request, {title, currentBody: '<p>Public body</p>'});
        const link = await createSL(request, prompt.id);

        await page.goto(`/share/${link.token}`);

        await expect(page.getByRole('heading', {name: title})).toBeVisible({timeout: 10_000});
        await expect(page.getByText('Public body')).toBeVisible();
        await expect(page.getByText('Prompt Vault').first()).toBeVisible();
    });

    test('invalid share token shows not found page', async ({page}) => {
        await page.goto('/share/invalid-token-xyz');
        await expect(page.getByRole('heading', {name: 'Not Found'})).toBeVisible({timeout: 10_000});
    });

    test('public share page has fork button', async ({page, request}) => {
        const {
            apiRegister,
            apiLogin,
            apiCreatePrompt: createP,
            apiCreateShareLink: createSL
        } = await import('../../helpers/api');
        const {uniqueEmail, TEST_PASSWORD} = await import('../../helpers/data-factory');

        const email = uniqueEmail();
        await apiRegister(request, email, TEST_PASSWORD);
        await apiLogin(request, email, TEST_PASSWORD);

        const title = uniqueName('ForkTarget');
        const prompt = await createP(request, {title, currentBody: '<p>fork me</p>'});
        const link = await createSL(request, prompt.id);

        await page.goto(`/share/${link.token}`);
        await expect(page.getByRole('button', {name: 'Fork to my vault'})).toBeVisible({timeout: 10_000});
    });

    test('public share page has export button', async ({page, request}) => {
        const {
            apiRegister,
            apiLogin,
            apiCreatePrompt: createP,
            apiCreateShareLink: createSL
        } = await import('../../helpers/api');
        const {uniqueEmail, TEST_PASSWORD} = await import('../../helpers/data-factory');

        const email = uniqueEmail();
        await apiRegister(request, email, TEST_PASSWORD);
        await apiLogin(request, email, TEST_PASSWORD);

        const title = uniqueName('ExportTarget');
        const prompt = await createP(request, {title, currentBody: '<p>export me</p>'});
        const link = await createSL(request, prompt.id);

        await page.goto(`/share/${link.token}`);
        await expect(page.getByText('Export .txt')).toBeVisible({timeout: 10_000});
    });
});
