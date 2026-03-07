import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {useTags} from './useTags';
import * as tagApiModule from '../api/tagApi';

vi.mock('../api/tagApi', () => ({
    tagApi: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockTagApi = tagApiModule.tagApi as {
    getAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

const tagA = {id: 't1', name: 'Tag A', createdAt: '2024-01-01', updatedAt: '2024-01-01'};
const tagB = {id: 't2', name: 'Tag B', createdAt: '2024-01-01', updatedAt: '2024-01-01'};

beforeEach(() => vi.clearAllMocks());

describe('useTags initial load', () => {
    it('loads tags on mount', async () => {
        mockTagApi.getAll.mockResolvedValueOnce([tagA, tagB]);
        const {result} = renderHook(() => useTags());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.tags).toEqual([tagA, tagB]);
        expect(result.current.error).toBeNull();
    });

    it('sets error on fetch failure', async () => {
        mockTagApi.getAll.mockRejectedValueOnce(new Error('Network'));
        const {result} = renderHook(() => useTags());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Failed to load tags');
    });
});

describe('useTags.createTag', () => {
    it('appends new tag', async () => {
        mockTagApi.getAll.mockResolvedValueOnce([tagA]);
        mockTagApi.create.mockResolvedValueOnce(tagB);

        const {result} = renderHook(() => useTags());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.createTag({name: 'Tag B'});
        });

        expect(result.current.tags).toEqual([tagA, tagB]);
    });

    it('sets error and rethrows on failure', async () => {
        mockTagApi.getAll.mockResolvedValueOnce([tagA]);
        mockTagApi.create.mockRejectedValueOnce(new Error('Server error'));

        const {result} = renderHook(() => useTags());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let thrown = false;
        await act(async () => {
            try {
                await result.current.createTag({name: 'x'});
            } catch {
                thrown = true;
            }
        });
        expect(thrown).toBe(true);
        expect(result.current.error).toBe('Failed to create tag');
    });
});

describe('useTags.updateTag', () => {
    it('updates tag in list', async () => {
        mockTagApi.getAll.mockResolvedValueOnce([tagA, tagB]);
        const updated = {...tagA, name: 'Updated'};
        mockTagApi.update.mockResolvedValueOnce(updated);

        const {result} = renderHook(() => useTags());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.updateTag('t1', {name: 'Updated'});
        });

        expect(result.current.tags.find(t => t.id === 't1')?.name).toBe('Updated');
    });

    it('sets error and rethrows on failure', async () => {
        mockTagApi.getAll.mockResolvedValueOnce([tagA]);
        mockTagApi.update.mockRejectedValueOnce(new Error('Server error'));

        const {result} = renderHook(() => useTags());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let thrown = false;
        await act(async () => {
            try {
                await result.current.updateTag('t1', {name: 'x'});
            } catch {
                thrown = true;
            }
        });
        expect(thrown).toBe(true);
        expect(result.current.error).toBe('Failed to update tag');
    });
});

describe('useTags.deleteTag', () => {
    it('removes tag from list', async () => {
        mockTagApi.getAll.mockResolvedValueOnce([tagA, tagB]);
        mockTagApi.delete.mockResolvedValueOnce(undefined);

        const {result} = renderHook(() => useTags());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.deleteTag('t1');
        });

        expect(result.current.tags).toEqual([tagB]);
    });

    it('sets error and rethrows on failure', async () => {
        mockTagApi.getAll.mockResolvedValueOnce([tagA]);
        mockTagApi.delete.mockRejectedValueOnce(new Error('Server error'));

        const {result} = renderHook(() => useTags());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let thrown = false;
        await act(async () => {
            try {
                await result.current.deleteTag('t1');
            } catch {
                thrown = true;
            }
        });
        expect(thrown).toBe(true);
        expect(result.current.error).toBe('Failed to delete tag');
    });
});
