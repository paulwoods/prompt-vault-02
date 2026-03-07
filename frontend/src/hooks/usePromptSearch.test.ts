import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {usePromptSearch} from './usePromptSearch';
import * as promptApiModule from '../api/promptApi';

vi.mock('../api/promptApi', () => ({
    promptApi: {
        getAll: vi.fn(),
        search: vi.fn(),
        filter: vi.fn(),
    },
}));

const mockPromptApi = promptApiModule.promptApi as {
    getAll: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    filter: ReturnType<typeof vi.fn>;
};

const makePrompt = (id: string) => ({
    id,
    userId: 'u1',
    title: `Prompt ${id}`,
    currentBody: 'body',
    isFavorite: false,
    rowVersion: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    tagIds: [],
});

beforeEach(() => vi.clearAllMocks());

describe('usePromptSearch initial load', () => {
    it('calls getAll when no search or filters', async () => {
        const prompts = [makePrompt('p1')];
        mockPromptApi.getAll.mockResolvedValue(prompts);

        const {result} = renderHook(() => usePromptSearch());

        await waitFor(() => expect(result.current.prompts).toEqual(prompts));
        expect(mockPromptApi.getAll).toHaveBeenCalled();
    });

    it('sets error when getAll fails', async () => {
        mockPromptApi.getAll.mockRejectedValue(new Error('Network'));

        const {result} = renderHook(() => usePromptSearch());

        await waitFor(() => expect(result.current.error).toBe('Failed to load prompts'));
    });
});

describe('usePromptSearch with search query', () => {
    it('calls search when query is set', async () => {
        mockPromptApi.getAll.mockResolvedValueOnce([]);
        const searchResults = [makePrompt('p2')];
        mockPromptApi.search.mockResolvedValueOnce(searchResults);

        const {result} = renderHook(() => usePromptSearch());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setSearchQuery('hello');
        });

        await waitFor(() => expect(mockPromptApi.search).toHaveBeenCalledWith('hello'));
        await waitFor(() => expect(result.current.prompts).toEqual(searchResults));
    });

    it('filters search results by folderId when both set', async () => {
        mockPromptApi.getAll.mockResolvedValueOnce([]);
        const p1 = {...makePrompt('p1'), folderId: 'f1'};
        const p2 = {...makePrompt('p2'), folderId: 'f2'};
        mockPromptApi.search.mockResolvedValueOnce([p1, p2]);

        const {result} = renderHook(() => usePromptSearch());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setFilters({folderId: 'f1'});
            result.current.setSearchQuery('hello');
        });

        await waitFor(() => expect(mockPromptApi.search).toHaveBeenCalled());
        await waitFor(() => expect(result.current.prompts).toEqual([p1]));
    });

    it('filters search results by tagId when both set', async () => {
        mockPromptApi.getAll.mockResolvedValueOnce([]);
        const p1 = {...makePrompt('p1'), tagIds: ['t1']};
        const p2 = {...makePrompt('p2'), tagIds: ['t2']};
        mockPromptApi.search.mockResolvedValueOnce([p1, p2]);

        const {result} = renderHook(() => usePromptSearch());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setFilters({tagId: 't1'});
            result.current.setSearchQuery('hello');
        });

        await waitFor(() => expect(mockPromptApi.search).toHaveBeenCalled());
        await waitFor(() => expect(result.current.prompts).toEqual([p1]));
    });

    it('filters search results by favorite when both set', async () => {
        mockPromptApi.getAll.mockResolvedValueOnce([]);
        const p1 = {...makePrompt('p1'), isFavorite: true};
        const p2 = {...makePrompt('p2'), isFavorite: false};
        mockPromptApi.search.mockResolvedValueOnce([p1, p2]);

        const {result} = renderHook(() => usePromptSearch());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setFilters({favorite: true});
            result.current.setSearchQuery('hello');
        });

        await waitFor(() => expect(mockPromptApi.search).toHaveBeenCalled());
        await waitFor(() => expect(result.current.prompts).toEqual([p1]));
    });
});

describe('usePromptSearch with filters only', () => {
    it('calls filter when filters are set without query', async () => {
        mockPromptApi.getAll.mockResolvedValueOnce([]);
        const filtered = [makePrompt('p3')];
        mockPromptApi.filter.mockResolvedValueOnce(filtered);

        const {result} = renderHook(() => usePromptSearch());
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setFilters({folderId: 'f1'});
        });

        await waitFor(() => expect(mockPromptApi.filter).toHaveBeenCalledWith({folderId: 'f1'}));
        await waitFor(() => expect(result.current.prompts).toEqual(filtered));
    });
});

describe('usePromptSearch.refresh', () => {
    it('re-fetches prompts when called', async () => {
        mockPromptApi.getAll.mockResolvedValue([]);

        const {result} = renderHook(() => usePromptSearch());
        await waitFor(() => expect(result.current.loading).toBe(false));

        const callsBefore = mockPromptApi.getAll.mock.calls.length;

        act(() => {
            result.current.refresh();
        });

        await waitFor(() => expect(mockPromptApi.getAll.mock.calls.length).toBeGreaterThan(callsBefore));
    });
});
