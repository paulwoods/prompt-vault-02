import {beforeEach, describe, expect, it, vi} from 'vitest';
import {promptApi} from './promptApi';
import * as apiFetchModule from './apiFetch';
import type {Prompt, PromptRequest} from '../types';

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
    title: 'Test Prompt',
    currentBody: 'body',
    isFavorite: false,
    rowVersion: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tagIds: [],
};

const sampleRequest: PromptRequest = {
    title: 'Test Prompt',
    currentBody: 'body',
    isFavorite: false,
};

beforeEach(() => vi.clearAllMocks());

describe('promptApi.getAll', () => {
    it('returns prompts on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([samplePrompt]));
        const result = await promptApi.getAll();
        expect(result).toEqual([samplePrompt]);
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(promptApi.getAll()).rejects.toThrow('Failed to fetch prompts');
    });
});

describe('promptApi.getById', () => {
    it('returns prompt on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(samplePrompt));
        const result = await promptApi.getById('p1');
        expect(result).toEqual(samplePrompt);
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 404));
        await expect(promptApi.getById('p1')).rejects.toThrow('Failed to fetch prompt');
    });
});

describe('promptApi.create', () => {
    it('returns created prompt', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(samplePrompt));
        const result = await promptApi.create(sampleRequest);
        expect(result).toEqual(samplePrompt);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({method: 'POST'}));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 400));
        await expect(promptApi.create(sampleRequest)).rejects.toThrow('Failed to create prompt');
    });
});

describe('promptApi.update', () => {
    it('returns updated prompt', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(samplePrompt));
        const result = await promptApi.update('p1', sampleRequest, 1);
        expect(result).toEqual(samplePrompt);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('rowVersion=1'), expect.objectContaining({method: 'PUT'}));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 409));
        await expect(promptApi.update('p1', sampleRequest, 1)).rejects.toThrow('Failed to save prompt');
    });
});

describe('promptApi.delete', () => {
    it('resolves on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await expect(promptApi.delete('p1')).resolves.toBeUndefined();
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(promptApi.delete('p1')).rejects.toThrow('Failed to delete prompt');
    });
});

describe('promptApi.getVersions', () => {
    it('returns versions on success', async () => {
        const versions = [{id: 'v1', promptId: 'p1', versionNumber: 1, bodySnapshot: 'body', createdAt: '2024-01-01'}];
        mockApiFetch.mockResolvedValueOnce(makeResponse(versions));
        const result = await promptApi.getVersions('p1');
        expect(result).toEqual(versions);
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(promptApi.getVersions('p1')).rejects.toThrow('Failed to fetch versions');
    });
});

describe('promptApi.restoreVersion', () => {
    it('returns prompt on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse(samplePrompt));
        const result = await promptApi.restoreVersion('p1', 'v1');
        expect(result).toEqual(samplePrompt);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('/versions/v1/restore'), expect.objectContaining({method: 'POST'}));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(promptApi.restoreVersion('p1', 'v1')).rejects.toThrow('Failed to restore version');
    });
});

describe('promptApi.search', () => {
    it('returns prompts on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([samplePrompt]));
        const result = await promptApi.search('test');
        expect(result).toEqual([samplePrompt]);
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('q=test'));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(promptApi.search('test')).rejects.toThrow('Failed to search prompts');
    });
});

describe('promptApi.filter', () => {
    it('includes folderId in query', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([samplePrompt]));
        await promptApi.filter({folderId: 'f1'});
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('folderId=f1'));
    });

    it('includes tagId in query', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([samplePrompt]));
        await promptApi.filter({tagId: 't1'});
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('tagId=t1'));
    });

    it('includes favorite in query', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([samplePrompt]));
        await promptApi.filter({favorite: true});
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('favorite=true'));
    });

    it('calls filter endpoint with no params when no filters', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse([samplePrompt]));
        await promptApi.filter({});
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('/prompts/filter'));
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(promptApi.filter({})).rejects.toThrow('Failed to filter prompts');
    });
});
