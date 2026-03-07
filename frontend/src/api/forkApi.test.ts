import {beforeEach, describe, expect, it, vi} from 'vitest';
import {forkApi} from './forkApi';
import * as apiFetchModule from './apiFetch';
import type {Prompt} from '../types';

const mockApiFetch = vi.spyOn(apiFetchModule, 'apiFetch');

function makeResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {'Content-Type': 'application/json'},
    });
}

const samplePrompt: Prompt = {
    id: 'p1',
    userId: 'u1',
    title: 'Forked Prompt',
    currentBody: 'body',
    isFavorite: false,
    rowVersion: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tagIds: [],
};

beforeEach(() => vi.clearAllMocks());

describe('forkApi.fork', () => {
    it('returns forked prompt on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(samplePrompt));
        const result = await forkApi.fork('tok123');
        expect(result).toEqual(samplePrompt);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('/fork/tok123'), expect.objectContaining({method: 'POST'}));
    });

    it('throws expired message on 410', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 410));
        await expect(forkApi.fork('tok123')).rejects.toThrow('This share link has expired or been revoked.');
    });

    it('throws generic message on other errors', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(forkApi.fork('tok123')).rejects.toThrow('Failed to fork prompt');
    });
});
