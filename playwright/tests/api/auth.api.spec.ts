import {expect, test} from '@playwright/test';
import {TEST_PASSWORD, uniqueEmail} from '../../helpers/data-factory';

const BASE = '/promptvault/api';

test.describe('Auth API', () => {
    test('POST /auth/register returns 200 with new user', async ({request}) => {
        const response = await request.post(`${BASE}/auth/register`, {
            data: {email: uniqueEmail(), password: TEST_PASSWORD},
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('email');
    });

    test('POST /auth/register with duplicate email returns error', async ({request}) => {
        const email = uniqueEmail();
        await request.post(`${BASE}/auth/register`, {
            data: {email, password: TEST_PASSWORD},
        });
        const response = await request.post(`${BASE}/auth/register`, {
            data: {email, password: TEST_PASSWORD},
        });
        expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('POST /auth/login with valid credentials returns 200', async ({request}) => {
        const email = uniqueEmail();
        await request.post(`${BASE}/auth/register`, {
            data: {email, password: TEST_PASSWORD},
        });
        const response = await request.post(`${BASE}/auth/login`, {
            data: {email, password: TEST_PASSWORD},
        });
        expect(response.status()).toBe(200);
    });

    test('POST /auth/login with wrong password returns 401', async ({request}) => {
        const email = uniqueEmail();
        await request.post(`${BASE}/auth/register`, {
            data: {email, password: TEST_PASSWORD},
        });
        const response = await request.post(`${BASE}/auth/login`, {
            data: {email, password: 'WrongPassword!999'},
        });
        expect(response.status()).toBe(401);
    });

    test('GET /me returns 401 when not authenticated', async ({request}) => {
        const response = await request.get(`${BASE}/me`);
        expect(response.status()).toBe(401);
    });

    test('GET /me returns user info when authenticated', async ({request}) => {
        const email = uniqueEmail();
        await request.post(`${BASE}/auth/register`, {
            data: {email, password: TEST_PASSWORD},
        });
        await request.post(`${BASE}/auth/login`, {
            data: {email, password: TEST_PASSWORD},
        });
        const response = await request.get(`${BASE}/me`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.email).toBe(email);
    });

    test('POST /auth/logout returns 200', async ({request}) => {
        const email = uniqueEmail();
        await request.post(`${BASE}/auth/register`, {
            data: {email, password: TEST_PASSWORD},
        });
        await request.post(`${BASE}/auth/login`, {
            data: {email, password: TEST_PASSWORD},
        });
        const response = await request.post(`${BASE}/auth/logout`);
        expect(response.status()).toBe(200);
    });
});
