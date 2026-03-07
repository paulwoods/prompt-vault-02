import {beforeEach, describe, expect, it, vi} from 'vitest';
import {shareLinkApi} from './shareLinkApi';
import * as apiFetchModule from './apiFetch';
import {API_BASE} from './apiFetch';
import type {PublicShare, ShareLink} from '../types';

const mockApiFetch = vi.spyOn(apiFetchModule, 'apiFetch');

function makeResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {'Content-Type': 'application/json'},
    });
}

const sampleShareLink: ShareLink = {
    id: 'sl1',
    promptId: 'p1',
    token: 'tok123',
    createdAt: '2024-01-01',
    active: true,
};

beforeEach(() => vi.clearAllMocks());

describe('shareLinkApi.create', () => {
    it('returns share link on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(sampleShareLink));
        const result = await shareLinkApi.create('p1');
        expect(result).toEqual(sampleShareLink);
        expect(mockApiFetch).toHaveBeenCalledWith(
            expect.stringContaining('/prompts/p1/share-links'),
            expect.objectContaining({method: 'POST'}),
        );
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(shareLinkApi.create('p1')).rejects.toThrow('Failed to create share link');
    });
});

describe('shareLinkApi.list', () => {
    it('returns share links on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([sampleShareLink]));
        const result = await shareLinkApi.list('p1');
        expect(result).toEqual([sampleShareLink]);
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(shareLinkApi.list('p1')).rejects.toThrow('Failed to list share links');
    });
});

describe('shareLinkApi.updateExpiration', () => {
    it('returns updated share link', async () => {
        const updated = {...sampleShareLink, expiresAt: '2025-01-01'};
        mockApiFetch.mockResolvedValueOnce(makeResponse(updated));
        const result = await shareLinkApi.updateExpiration('sl1', '2025-01-01');
        expect(result).toEqual(updated);
        expect(mockApiFetch).toHaveBeenCalledWith(
            expect.stringContaining('/share-links/sl1'),
            expect.objectContaining({method: 'PUT'}),
        );
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(shareLinkApi.updateExpiration('sl1', null)).rejects.toThrow('Failed to update share link');
    });
});

describe('shareLinkApi.revoke', () => {
    it('resolves on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await expect(shareLinkApi.revoke('sl1')).resolves.toBeUndefined();
        expect(mockApiFetch).toHaveBeenCalledWith(
            expect.stringContaining('/share-links/sl1'),
            expect.objectContaining({method: 'DELETE'}),
        );
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(shareLinkApi.revoke('sl1')).rejects.toThrow('Failed to revoke share link');
    });
});

describe('shareLinkApi.getPublic', () => {
    it('returns public share on success', async () => {
        const publicShare: PublicShare = {promptId: 'p1', title: 'T', body: 'B', sharedAt: '2024-01-01'};
        mockApiFetch.mockResolvedValueOnce(makeResponse(publicShare));
        const result = await shareLinkApi.getPublic('tok123');
        expect(result).toEqual(publicShare);
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 404));
        await expect(shareLinkApi.getPublic('tok123')).rejects.toThrow('Share link not found or expired');
    });
});

describe('shareLinkApi.exportUrl', () => {
    it('returns correct export URL', () => {
        const url = shareLinkApi.exportUrl('tok123');
        expect(url).toBe(`${API_BASE}/share/tok123/export`);
    });
});

describe('shareLinkApi.emailShare', () => {
    it('resolves on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await expect(shareLinkApi.emailShare('p1', 'a@b.com')).resolves.toBeUndefined();
        expect(mockApiFetch).toHaveBeenCalledWith(
            expect.stringContaining('/prompts/p1/share-links/email'),
            expect.objectContaining({method: 'POST'}),
        );
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(shareLinkApi.emailShare('p1', 'a@b.com')).rejects.toThrow('Failed to send share email');
    });
});
