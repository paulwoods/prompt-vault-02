import {beforeEach, describe, expect, it, vi} from 'vitest';
import {tagApi} from './tagApi';
import * as apiFetchModule from './apiFetch';
import type {Tag} from '../types';

const mockApiFetch = vi.spyOn(apiFetchModule, 'apiFetch');

function makeResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {'Content-Type': 'application/json'},
    });
}

const sampleTag: Tag = {
    id: 't1',
    name: 'myTag',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
};

beforeEach(() => vi.clearAllMocks());

describe('tagApi.getAll', () => {
    it('returns tags on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([sampleTag]));
        const result = await tagApi.getAll();
        expect(result).toEqual([sampleTag]);
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(tagApi.getAll()).rejects.toThrow('Failed to fetch tags');
    });
});

describe('tagApi.create', () => {
    it('returns created tag', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(sampleTag));
        const result = await tagApi.create({name: 'myTag'});
        expect(result).toEqual(sampleTag);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({method: 'POST'}));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 400));
        await expect(tagApi.create({name: 'myTag'})).rejects.toThrow('Failed to create tag');
    });
});

describe('tagApi.update', () => {
    it('returns updated tag', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(sampleTag));
        const result = await tagApi.update('t1', {name: 'updated'});
        expect(result).toEqual(sampleTag);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('/tags/t1'), expect.objectContaining({method: 'PUT'}));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(tagApi.update('t1', {name: 'updated'})).rejects.toThrow('Failed to update tag');
    });
});

describe('tagApi.delete', () => {
    it('resolves on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await expect(tagApi.delete('t1')).resolves.toBeUndefined();
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(tagApi.delete('t1')).rejects.toThrow('Failed to delete tag');
    });
});
