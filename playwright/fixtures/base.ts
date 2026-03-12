import {expect, type Page, test as base} from '@playwright/test';
import {loginViaUI, TEST_EMAIL, TEST_PASSWORD} from '../helpers/auth';
import {apiRegister} from '../helpers/api';
import {uniqueEmail} from '../helpers/data-factory';

type Fixtures = {
    /** A page already logged in as the shared test user */
    authedPage: Page;
    /** A page logged in as a freshly-registered one-off user */
    freshUserPage: Page;
};

export const test = base.extend<Fixtures>({
    authedPage: async ({page, request}, use) => {
        // Register test user if not existing, then login
        const email = TEST_EMAIL;
        const password = TEST_PASSWORD;
        try {
            await apiRegister(request, email, password);
        } catch {
            // User may already exist — that's fine
        }
        await loginViaUI(page, email, password);
        await use(page);
    },

    freshUserPage: async ({page, request}, use) => {
        const email = uniqueEmail();
        const password = TEST_PASSWORD;
        await apiRegister(request, email, password);
        await loginViaUI(page, email, password);
        await use(page);
    },
});

export {expect};
