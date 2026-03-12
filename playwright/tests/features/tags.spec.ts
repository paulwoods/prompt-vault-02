import {expect, test} from '../../fixtures/base';
import {AppPage} from '../../pages/AppPage';
import {apiCreatePrompt, apiCreateTag, apiDeletePrompt, apiDeleteTag} from '../../helpers/api';
import {uniqueName} from '../../helpers/data-factory';

test.describe('Tags', () => {
    test('Tags section is visible in sidebar', async ({authedPage}) => {
        await expect(authedPage.getByText('Tags', {exact: true}).first()).toBeVisible();
    });

    test('+ New Tag button is visible', async ({authedPage}) => {
        const app = new AppPage(authedPage);
        await expect(app.newTagButton).toBeVisible();
    });

    test('can create a new tag', async ({authedPage}) => {
        const tagName = uniqueName('TagA');
        const app = new AppPage(authedPage);
        await app.createTag(tagName);
        await expect(authedPage.getByRole('button', {name: `#${tagName}`})).toBeVisible();
    });

    test('clicking a tag filters the prompt list', async ({authedPage, request}) => {
        const tagName = uniqueName('FilterTag');
        const tag = await apiCreateTag(request, tagName);

        const taggedTitle = uniqueName('TaggedPrompt');
        const untaggedTitle = uniqueName('UntaggedPrompt');

        const p1 = await apiCreatePrompt(request, {
            title: taggedTitle,
            currentBody: '<p>tagged</p>',
            tagIds: [tag.id],
        });
        const p2 = await apiCreatePrompt(request, {title: untaggedTitle, currentBody: '<p>no tag</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);
        await app.clickTag(tagName);

        await expect(app.promptItem(taggedTitle)).toBeVisible();
        await expect(app.promptItem(untaggedTitle)).not.toBeVisible();

        await apiDeletePrompt(request, p1.id);
        await apiDeletePrompt(request, p2.id);
        await apiDeleteTag(request, tag.id);
    });

    test('can rename a tag', async ({authedPage, request}) => {
        const oldName = uniqueName('OldTag');
        const newName = uniqueName('RenamedTag');
        const tag = await apiCreateTag(request, oldName);

        await authedPage.reload();

        const tagButton = authedPage.getByRole('button', {name: `#${oldName}`});
        await tagButton.hover();
        await authedPage.getByRole('button', {name: 'Edit'}).first().click();

        const renameInput = authedPage.locator('input[value]').first();
        await renameInput.clear();
        await renameInput.fill(newName);
        await renameInput.press('Enter');

        await expect(authedPage.getByRole('button', {name: `#${newName}`})).toBeVisible();

        await apiDeleteTag(request, tag.id);
    });

    test('can delete a tag via confirmation dialog', async ({authedPage, request}) => {
        const tagName = uniqueName('DeleteTag');
        const tag = await apiCreateTag(request, tagName);

        await authedPage.reload();

        const tagButton = authedPage.getByRole('button', {name: `#${tagName}`});
        await tagButton.hover();

        // Intercept the browser confirm dialog
        authedPage.once('dialog', dialog => dialog.accept());
        await authedPage.getByRole('button', {name: 'Del'}).first().click();

        await expect(authedPage.getByRole('button', {name: `#${tagName}`})).not.toBeVisible();
    });
});
