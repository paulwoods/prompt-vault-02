import {expect, test} from '@playwright/test';
import {TEST_PASSWORD, uniqueEmail, uniqueName} from '../../helpers/data-factory';

const BASE = '/promptvault/api';

async function loginAsNewUser(request: any): Promise<string> {
    const email = uniqueEmail();
    await request.post(`${BASE}/auth/register`, {data: {email, password: TEST_PASSWORD}});
    await request.post(`${BASE}/auth/login`, {data: {email, password: TEST_PASSWORD}});
    return email;
}

test.describe('Prompts API', () => {
    test('GET /prompts returns 401 when not authenticated', async ({request}) => {
        const response = await request.get(`${BASE}/prompts`);
        expect(response.status()).toBe(401);
    });

    test('GET /prompts returns empty array for new user', async ({request}) => {
        await loginAsNewUser(request);
        const response = await request.get(`${BASE}/prompts`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('POST /prompts creates a prompt and returns it', async ({request}) => {
        await loginAsNewUser(request);
        const title = uniqueName('API Prompt');
        const response = await request.post(`${BASE}/prompts`, {
            data: {title, currentBody: '<p>hello</p>', isFavorite: false, tagIds: []},
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.title).toBe(title);
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('rowVersion');
    });

    test('GET /prompts returns created prompt', async ({request}) => {
        await loginAsNewUser(request);
        const title = uniqueName('Listed');
        await request.post(`${BASE}/prompts`, {
            data: {title, currentBody: '<p>body</p>', isFavorite: false, tagIds: []},
        });
        const response = await request.get(`${BASE}/prompts`);
        const prompts = await response.json();
        expect(prompts.some((p: any) => p.title === title)).toBe(true);
    });

    test('PUT /prompts/:id updates the prompt', async ({request}) => {
        await loginAsNewUser(request);
        const title = uniqueName('Update Me');
        const created = await (await request.post(`${BASE}/prompts`, {
            data: {title, currentBody: '<p>v1</p>', isFavorite: false, tagIds: []},
        })).json();

        const newTitle = uniqueName('Updated');
        const response = await request.put(`${BASE}/prompts/${created.id}?rowVersion=${created.rowVersion}`, {
            data: {title: newTitle, currentBody: '<p>v2</p>', isFavorite: false, tagIds: []},
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.title).toBe(newTitle);
    });

    test('DELETE /prompts/:id removes the prompt', async ({request}) => {
        await loginAsNewUser(request);
        const created = await (await request.post(`${BASE}/prompts`, {
            data: {title: uniqueName('Delete Me'), currentBody: '<p>x</p>', isFavorite: false, tagIds: []},
        })).json();

        const deleteResp = await request.delete(`${BASE}/prompts/${created.id}`);
        expect(deleteResp.status()).toBe(204);

        const list = await (await request.get(`${BASE}/prompts`)).json();
        expect(list.some((p: any) => p.id === created.id)).toBe(false);
    });

    test('GET /prompts/search returns matching prompts', async ({request}) => {
        await loginAsNewUser(request);
        const unique = `UNIQUESEARCH${Date.now()}`;
        await request.post(`${BASE}/prompts`, {
            data: {title: unique, currentBody: '<p>body</p>', isFavorite: false, tagIds: []},
        });

        const response = await request.get(`${BASE}/prompts/search?q=${unique}`);
        expect(response.status()).toBe(200);
        const results = await response.json();
        expect(results.some((p: any) => p.title === unique)).toBe(true);
    });

    test('GET /prompts/:id/versions returns version list', async ({request}) => {
        await loginAsNewUser(request);
        const created = await (await request.post(`${BASE}/prompts`, {
            data: {title: uniqueName('Versioned'), currentBody: '<p>v1</p>', isFavorite: false, tagIds: []},
        })).json();

        const response = await request.get(`${BASE}/prompts/${created.id}/versions`);
        expect(response.status()).toBe(200);
        const versions = await response.json();
        expect(Array.isArray(versions)).toBe(true);
        expect(versions.length).toBeGreaterThanOrEqual(1);
    });
});
