import {expect, test} from '../../fixtures/base';
import {AppPage} from '../../pages/AppPage';
import {apiCreatePrompt, apiDeletePrompt} from '../../helpers/api';
import {uniqueName} from '../../helpers/data-factory';

test.describe('Prompt Search', () => {
    test('search filters prompt list by title', async ({authedPage, request}) => {
        const unique = uniqueName('SearchTarget');
        const otherTitle = uniqueName('IrrelevantPrompt');

        const p1 = await apiCreatePrompt(request, {title: unique, currentBody: '<p>x</p>'});
        const p2 = await apiCreatePrompt(request, {title: otherTitle, currentBody: '<p>y</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);

        await app.searchFor(unique);
        await expect(app.promptItem(unique)).toBeVisible();
        await expect(app.promptItem(otherTitle)).not.toBeVisible();

        await apiDeletePrompt(request, p1.id);
        await apiDeletePrompt(request, p2.id);
    });

    test('search with no results shows empty list', async ({freshUserPage}) => {
        const app = new AppPage(freshUserPage);
        await app.searchFor('zzznomatch999');
        await expect(freshUserPage.getByText('No prompts yet.')).toBeVisible();
    });

    test('clearing search restores full list', async ({authedPage, request}) => {
        const title = uniqueName('ClearTest');
        const prompt = await apiCreatePrompt(request, {title, currentBody: '<p>x</p>'});

        await authedPage.reload();
        const app = new AppPage(authedPage);

        await app.searchFor('zzznomatch999');
        await expect(app.promptItem(title)).not.toBeVisible();

        await app.clearSearch();
        await expect(app.promptItem(title)).toBeVisible();

        await apiDeletePrompt(request, prompt.id);
    });
});
