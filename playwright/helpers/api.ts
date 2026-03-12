import {APIRequestContext} from '@playwright/test';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';
const PROMPT_VAULT_PATH = '/promptvault/api';

export async function apiLogin(
    request: APIRequestContext,
    email: string,
    password: string,
): Promise<void> {
    const response = await request.post(`${API_BASE}${PROMPT_VAULT_PATH}/auth/login`, {
        data: {email, password},
    });
    if (!response.ok()) {
        throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }
}

export async function apiRegister(
    request: APIRequestContext,
    email: string,
    password: string,
): Promise<{ id: string; email: string }> {
    const response = await request.post(`${API_BASE}${PROMPT_VAULT_PATH}/auth/register`, {
        data: {email, password},
    });
    if (!response.ok()) {
        throw new Error(`Register failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
}

export async function apiLogout(request: APIRequestContext): Promise<void> {
    await request.post(`${API_BASE}${PROMPT_VAULT_PATH}/auth/logout`);
}

export async function apiCreatePrompt(
    request: APIRequestContext,
    data: { title: string; currentBody: string; folderId?: string; tagIds?: string[] },
): Promise<{ id: string; title: string; currentBody: string; rowVersion: number }> {
    const response = await request.post(`${API_BASE}${PROMPT_VAULT_PATH}/prompts`, {
        data: {
            isFavorite: false,
            tagIds: [],
            ...data,
        },
    });
    if (!response.ok()) {
        throw new Error(`Create prompt failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
}

export async function apiDeletePrompt(
    request: APIRequestContext,
    promptId: string,
): Promise<void> {
    await request.delete(`${API_BASE}${PROMPT_VAULT_PATH}/prompts/${promptId}`);
}

export async function apiCreateFolder(
    request: APIRequestContext,
    name: string,
): Promise<{ id: string; name: string }> {
    const response = await request.post(`${API_BASE}${PROMPT_VAULT_PATH}/folders`, {
        data: {name},
    });
    if (!response.ok()) {
        throw new Error(`Create folder failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
}

export async function apiDeleteFolder(
    request: APIRequestContext,
    folderId: string,
): Promise<void> {
    await request.delete(`${API_BASE}${PROMPT_VAULT_PATH}/folders/${folderId}?mode=delete`);
}

export async function apiCreateTag(
    request: APIRequestContext,
    name: string,
): Promise<{ id: string; name: string }> {
    const response = await request.post(`${API_BASE}${PROMPT_VAULT_PATH}/tags`, {
        data: {name},
    });
    if (!response.ok()) {
        throw new Error(`Create tag failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
}

export async function apiDeleteTag(
    request: APIRequestContext,
    tagId: string,
): Promise<void> {
    await request.delete(`${API_BASE}${PROMPT_VAULT_PATH}/tags/${tagId}`);
}

export async function apiCreateShareLink(
    request: APIRequestContext,
    promptId: string,
): Promise<{ id: string; token: string; active: boolean }> {
    const response = await request.post(`${API_BASE}${PROMPT_VAULT_PATH}/prompts/${promptId}/share-links`);
    if (!response.ok()) {
        throw new Error(`Create share link failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
}
