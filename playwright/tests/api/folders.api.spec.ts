import {expect, test} from '@playwright/test';
import {TEST_PASSWORD, uniqueEmail, uniqueName} from '../../helpers/data-factory';

const BASE = '/promptvault/api';

async function loginAsNewUser(request: any): Promise<void> {
    const email = uniqueEmail();
    await request.post(`${BASE}/auth/register`, {data: {email, password: TEST_PASSWORD}});
    await request.post(`${BASE}/auth/login`, {data: {email, password: TEST_PASSWORD}});
}

test.describe('Folders API', () => {
    test('GET /folders returns 401 when not authenticated', async ({request}) => {
        const response = await request.get(`${BASE}/folders`);
        expect(response.status()).toBe(401);
    });

    test('GET /folders returns empty array for new user', async ({request}) => {
        await loginAsNewUser(request);
        const response = await request.get(`${BASE}/folders`);
        expect(response.status()).toBe(200);
        expect(Array.isArray(await response.json())).toBe(true);
    });

    test('POST /folders creates a folder', async ({request}) => {
        await loginAsNewUser(request);
        const name = uniqueName('Folder');
        const response = await request.post(`${BASE}/folders`, {data: {name}});
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.name).toBe(name);
        expect(body).toHaveProperty('id');
    });

    test('PUT /folders/:id renames a folder', async ({request}) => {
        await loginAsNewUser(request);
        const created = await (await request.post(`${BASE}/folders`, {
            data: {name: uniqueName('OldFolder')},
        })).json();

        const newName = uniqueName('NewFolder');
        const response = await request.put(`${BASE}/folders/${created.id}`, {data: {name: newName}});
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.name).toBe(newName);
    });

    test('DELETE /folders/:id removes the folder', async ({request}) => {
        await loginAsNewUser(request);
        const created = await (await request.post(`${BASE}/folders`, {
            data: {name: uniqueName('DeleteFolder')},
        })).json();

        const response = await request.delete(`${BASE}/folders/${created.id}?mode=delete`);
        expect(response.status()).toBe(204);

        const list = await (await request.get(`${BASE}/folders`)).json();
        expect(list.some((f: any) => f.id === created.id)).toBe(false);
    });
});
