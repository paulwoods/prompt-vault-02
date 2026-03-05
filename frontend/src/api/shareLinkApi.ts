import {API_BASE, apiFetch} from './apiFetch';
import type {PublicShare, ShareLink, ShareLinkRequest} from '../types';

export const shareLinkApi = {
    async create(promptId: string, request?: ShareLinkRequest): Promise<ShareLink> {
        const response = await apiFetch(`${API_BASE}/prompts/${promptId}/share-links`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(request ?? {}),
        });
        if (!response.ok) throw new Error('Failed to create share link');
        return response.json();
    },

    async list(promptId: string): Promise<ShareLink[]> {
        const response = await apiFetch(`${API_BASE}/prompts/${promptId}/share-links`);
        if (!response.ok) throw new Error('Failed to list share links');
        return response.json();
    },

    async updateExpiration(shareLinkId: string, expiresAt: string | null): Promise<ShareLink> {
        const response = await apiFetch(`${API_BASE}/share-links/${shareLinkId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({expiresAt}),
        });
        if (!response.ok) throw new Error('Failed to update share link');
        return response.json();
    },

    async revoke(shareLinkId: string): Promise<void> {
        const response = await apiFetch(`${API_BASE}/share-links/${shareLinkId}`, {method: 'DELETE'});
        if (!response.ok) throw new Error('Failed to revoke share link');
    },

    async getPublic(token: string): Promise<PublicShare> {
        const response = await apiFetch(`${API_BASE}/share/${token}`);
        if (!response.ok) throw new Error('Share link not found or expired');
        return response.json();
    },

    exportUrl(token: string): string {
        return `${API_BASE}/share/${token}/export`;
    },
};
