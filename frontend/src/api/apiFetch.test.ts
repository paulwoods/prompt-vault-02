import {beforeEach, describe, expect, it, vi} from 'vitest';
import {API_BASE, apiFetch} from './apiFetch';

describe('API_BASE', () => {
    it('equals /promptvault/api', () => {
        expect(API_BASE).toBe('/promptvault/api');
    });
});

describe('apiFetch', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('calls fetch with credentials include', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(new Response('{}', {status: 200}));

        await apiFetch('/test-url');

        expect(mockFetch).toHaveBeenCalledWith('/test-url', expect.objectContaining({
            credentials: 'include',
        }));
    });

    it('merges provided init options', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(new Response('{}', {status: 200}));

        await apiFetch('/test-url', {method: 'POST', headers: {'Content-Type': 'application/json'}});

        expect(mockFetch).toHaveBeenCalledWith('/test-url', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
        }));
    });

    it('returns the fetch response', async () => {
        const mockFetch = vi.mocked(fetch);
        const mockResponse = new Response('{"ok":true}', {status: 200});
        mockFetch.mockResolvedValueOnce(mockResponse);

        const result = await apiFetch('/test-url');
        expect(result).toBe(mockResponse);
    });
});
