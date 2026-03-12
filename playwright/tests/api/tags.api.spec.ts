import {expect, test} from '@playwright/test';
import {TEST_PASSWORD, uniqueEmail, uniqueName} from '../../helpers/data-factory';

const BASE = '/promptvault/api';

async function loginAsNewUser(request: any): Promise<void> {
    const email = uniqueEmail();
    await request.post(`${BASE}/auth/register`, {data: {email, password: TEST_PASSWORD}});
    await request.post(`${BASE}/auth/login`, {data: {email, password: TEST_PASSWORD}});
}

test.describe('Tags API', () => {
    test('GET /tags returns 401 when not authenticated', async ({request}) => {
        const response = await request.get(`${BASE}/tags`);
        expect(response.status()).toBe(401);
    });

    test('GET /tags returns empty array for new user', async ({request}) => {
        await loginAsNewUser(request);
        const response = await request.get(`${BASE}/tags`);
        expect(response.status()).toBe(200);
        expect(Array.isArray(await response.json())).toBe(true);
    });

    test('POST /tags creates a tag', async ({request}) => {
        await loginAsNewUser(request);
        const name = uniqueName('Tag');
        const response = await request.post(`${BASE}/tags`, {data: {name}});
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.name).toBe(name);
        expect(body).toHaveProperty('id');
    });

    test('PUT /tags/:id updates a tag name', async ({request}) => {
        await loginAsNewUser(request);
        const created = await (await request.post(`${BASE}/tags`, {
            data: {name: uniqueName('OldTag')},
        })).json();

        const newName = uniqueName('NewTag');
        const response = await request.put(`${BASE}/tags/${created.id}`, {data: {name: newName}});
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.name).toBe(newName);
    });

    test('DELETE /tags/:id removes the tag', async ({request}) => {
        await loginAsNewUser(request);
        const created = await (await request.post(`${BASE}/tags`, {
            data: {name: uniqueName('DeleteTag')},
        })).json();

        const response = await request.delete(`${BASE}/tags/${created.id}`);
        expect(response.status()).toBe(204);

        const list = await (await request.get(`${BASE}/tags`)).json();
        expect(list.some((t: any) => t.id === created.id)).toBe(false);
    });
});
