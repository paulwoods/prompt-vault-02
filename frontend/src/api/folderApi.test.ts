import {beforeEach, describe, expect, it, vi} from 'vitest';
import {folderApi} from './folderApi';
import * as apiFetchModule from './apiFetch';
import type {Folder} from '../types';

const mockApiFetch = vi.spyOn(apiFetchModule, 'apiFetch');

function makeResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {'Content-Type': 'application/json'},
    });
}

const sampleFolder: Folder = {id: 'f1', name: 'My Folder'};

beforeEach(() => vi.clearAllMocks());

describe('folderApi.getAll', () => {
    it('returns folders on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([sampleFolder]));
        const result = await folderApi.getAll();
        expect(result).toEqual([sampleFolder]);
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(folderApi.getAll()).rejects.toThrow('Failed to fetch folders');
    });
});

describe('folderApi.create', () => {
    it('returns created folder', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(sampleFolder));
        const result = await folderApi.create({name: 'My Folder'});
        expect(result).toEqual(sampleFolder);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({method: 'POST'}));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 400));
        await expect(folderApi.create({name: 'My Folder'})).rejects.toThrow('Failed to create folder');
    });
});

describe('folderApi.rename', () => {
    it('returns updated folder', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({...sampleFolder, name: 'Renamed'}));
        const result = await folderApi.rename('f1', {name: 'Renamed'});
        expect(result.name).toBe('Renamed');
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('/folders/f1'), expect.objectContaining({method: 'PUT'}));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(folderApi.rename('f1', {name: 'Renamed'})).rejects.toThrow('Failed to rename folder');
    });
});

describe('folderApi.delete', () => {
    it('calls delete endpoint with mode param', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await folderApi.delete('f1', 'delete');
        expect(mockApiFetch).toHaveBeenCalledWith(
            expect.stringContaining('mode=delete'),
            expect.objectContaining({method: 'DELETE'}),
        );
    });

    it('includes targetFolderId when provided', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await folderApi.delete('f1', 'move', 'f2');
        expect(mockApiFetch).toHaveBeenCalledWith(
            expect.stringContaining('targetFolderId=f2'),
            expect.objectContaining({method: 'DELETE'}),
        );
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(folderApi.delete('f1', 'delete')).rejects.toThrow('Failed to delete folder');
    });
});
