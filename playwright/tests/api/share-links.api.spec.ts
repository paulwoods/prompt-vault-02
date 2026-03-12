import {expect, test} from '@playwright/test';
import {TEST_PASSWORD, uniqueEmail, uniqueName} from '../../helpers/data-factory';

const BASE = '/promptvault/api';

async function loginAndCreatePrompt(request: any): Promise<{ promptId: string }> {
    const email = uniqueEmail();
    await request.post(`${BASE}/auth/register`, {data: {email, password: TEST_PASSWORD}});
    await request.post(`${BASE}/auth/login`, {data: {email, password: TEST_PASSWORD}});

    const prompt = await (await request.post(`${BASE}/prompts`, {
        data: {title: uniqueName('Share Prompt'), currentBody: '<p>share me</p>', isFavorite: false, tagIds: []},
    })).json();

    return {promptId: prompt.id};
}

test.describe('Share Links API', () => {
    test('GET /prompts/:id/share-links returns empty array initially', async ({request}) => {
        const {promptId} = await loginAndCreatePrompt(request);
        const response = await request.get(`${BASE}/prompts/${promptId}/share-links`);
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual([]);
    });

    test('POST /prompts/:id/share-links creates a share link', async ({request}) => {
        const {promptId} = await loginAndCreatePrompt(request);
        const response = await request.post(`${BASE}/prompts/${promptId}/share-links`);
        expect(response.status()).toBe(200);
        const link = await response.json();
        expect(link).toHaveProperty('token');
        expect(link).toHaveProperty('id');
        expect(link.active).toBe(true);
    });

    test('GET /share/:token returns prompt data publicly', async ({request}) => {
        const {promptId} = await loginAndCreatePrompt(request);
        const link = await (await request.post(`${BASE}/prompts/${promptId}/share-links`)).json();

        // Access public share endpoint (no auth required)
        const response = await request.get(`${BASE}/share/${link.token}`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('title');
        expect(body).toHaveProperty('body');
    });

    test('DELETE /share-links/:id revokes the link', async ({request}) => {
        const {promptId} = await loginAndCreatePrompt(request);
        const link = await (await request.post(`${BASE}/prompts/${promptId}/share-links`)).json();

        const response = await request.delete(`${BASE}/share-links/${link.id}`);
        expect(response.status()).toBe(204);

        const links = await (await request.get(`${BASE}/prompts/${promptId}/share-links`)).json();
        expect(links.some((l: any) => l.id === link.id)).toBe(false);
    });

    test('GET /share/:token after revoke returns 410', async ({request}) => {
        const {promptId} = await loginAndCreatePrompt(request);
        const link = await (await request.post(`${BASE}/prompts/${promptId}/share-links`)).json();
        await request.delete(`${BASE}/share-links/${link.id}`);

        const response = await request.get(`${BASE}/share/${link.token}`);
        expect(response.status()).toBe(410);
    });

    test('GET /share/invalid-token returns 404', async ({request}) => {
        const response = await request.get(`${BASE}/share/totally-invalid-token-xyz`);
        expect(response.status()).toBe(404);
    });
});
