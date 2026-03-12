import {expect, test} from '../../fixtures/base';
import {AppPage} from '../../pages/AppPage';
import {apiCreateFolder, apiCreatePrompt, apiDeleteFolder, apiDeletePrompt} from '../../helpers/api';
import {uniqueName} from '../../helpers/data-factory';

test.describe('Folders', () => {
    test('Folders section is visible in sidebar', async ({authedPage}) => {
        await expect(authedPage.getByText('Folders', {exact: true}).first()).toBeVisible();
    });

    test('All Prompts is shown and selected by default', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await expect(app.allPromptsButton).toBeVisible();
    });

    test('+ New Folder button is visible', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await expect(app.newFolderButton).toBeVisible();
    });

    test('can create a new folder', async ({authedPage}) => {
        const folderName = uniqueName('FolderA');
        const app = new AppPage(authedPage);
        await app.createFolder(folderName);
        await expect(authedPage.getByRole('button', {name: folderName})).toBeVisible();
    });

    test('clicking a folder filters the prompt list', async ({authedPage, request}) => {
        const folderName = uniqueName('FilterFolder');
        const folder = await apiCreateFolder(request, folderName);

        const insideTitle = uniqueName('InsideFolder');
        const outsideTitle = uniqueName('OutsideFolder');

        const p1 = await apiCreatePrompt(request, {
            title: insideTitle,
            currentBody: '<p>in</p>',
            folderId: folder.id,
        });
        const p2 = await apiCreatePrompt(request, {title: outsideTitle, currentBody: '<p>out</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickFolder(folderName);

        await expect(app.promptItem(insideTitle)).toBeVisible();
        await expect(app.promptItem(outsideTitle)).not.toBeVisible();

        await apiDeletePrompt(request, p1.id);
        await apiDeletePrompt(request, p2.id);
        await apiDeleteFolder(request, folder.id);
    });

    test('All Prompts button clears folder filter', async ({authedPage, request}) => {
        const folderName = uniqueName('AllPromptsReset');
        const folder = await apiCreateFolder(request, folderName);
        const title = uniqueName('FilteredPrompt');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickFolder(folderName);
        await expect(app.promptItem(title)).not.toBeVisible();

        await app.allPromptsButton.click();
        await expect(app.promptItem(title)).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
        await apiDeleteFolder(request, folder.id);
    });

    test('can rename a folder', async ({authedPage, request}) => {
        const oldName = uniqueName('OldFolder');
        const newName = uniqueName('RenamedFolder');
        const folder = await apiCreateFolder(request, oldName);

        await authedPage.reload();
        const app = new AppPage(authedPage);

        // Hover the folder item to reveal Edit button
        const folderButton = authedPage.getByRole('button', {name: oldName});
        await folderButton.hover();
        await authedPage.getByRole('button', {name: 'Edit'}).first().click();

        const renameInput = authedPage.locator('input[value]').first();
        await renameInput.clear();
        await renameInput.fill(newName);
        await renameInput.press('Enter');

        await expect(authedPage.getByRole('button', {name: newName})).toBeVisible();

        await apiDeleteFolder(request, folder.id);
    });

    test('can delete a folder', async ({authedPage, request}) => {
        const folderName = uniqueName('DeleteFolder');
        const folder = await apiCreateFolder(request, folderName);

        await authedPage.reload();
        const app = new AppPage(authedPage);

        const folderButton = authedPage.getByRole('button', {name: folderName});
        await folderButton.hover();
        await authedPage.getByRole('button', {name: 'Del'}).first().click();

        // Delete folder modal should appear
        await authedPage.getByRole('button', {name: /delete|confirm/i}).last().click();

        await expect(authedPage.getByRole('button', {name: folderName})).not.toBeVisible();
    });
});
