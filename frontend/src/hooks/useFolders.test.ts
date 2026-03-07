import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {useFolders} from './useFolders';
import * as folderApiModule from '../api/folderApi';

vi.mock('../api/folderApi', () => ({
    folderApi: {
        getAll: vi.fn(),
        create: vi.fn(),
        rename: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockFolderApi = folderApiModule.folderApi as {
    getAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    rename: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
};

const folderA = {id: 'f1', name: 'Folder A'};
const folderB = {id: 'f2', name: 'Folder B'};

beforeEach(() => vi.clearAllMocks());

describe('useFolders initial load', () => {
    it('loads folders on mount', async () => {
        mockFolderApi.getAll.mockResolvedValueOnce([folderA, folderB]);
        const {result} = renderHook(() => useFolders());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.folders).toEqual([folderA, folderB]);
        expect(result.current.error).toBeNull();
    });

    it('sets error on fetch failure', async () => {
        mockFolderApi.getAll.mockRejectedValueOnce(new Error('Network'));
        const {result} = renderHook(() => useFolders());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.error).toBe('Failed to load folders');
    });
});

describe('useFolders.createFolder', () => {
    it('appends new folder to list', async () => {
        mockFolderApi.getAll.mockResolvedValueOnce([folderA]);
        mockFolderApi.create.mockResolvedValueOnce(folderB);

        const {result} = renderHook(() => useFolders());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.createFolder({name: 'Folder B'});
        });

        expect(result.current.folders).toEqual([folderA, folderB]);
    });

    it('sets error and rethrows on failure', async () => {
        mockFolderApi.getAll.mockResolvedValueOnce([folderA]);
        mockFolderApi.create.mockRejectedValueOnce(new Error('Server error'));

        const {result} = renderHook(() => useFolders());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let thrown = false;
        await act(async () => {
            try {
                await result.current.createFolder({name: 'x'});
            } catch {
                thrown = true;
            }
        });
        expect(thrown).toBe(true);
        expect(result.current.error).toBe('Failed to create folder');
    });
});

describe('useFolders.renameFolder', () => {
    it('updates folder in list', async () => {
        mockFolderApi.getAll.mockResolvedValueOnce([folderA, folderB]);
        const renamed = {...folderA, name: 'Renamed'};
        mockFolderApi.rename.mockResolvedValueOnce(renamed);

        const {result} = renderHook(() => useFolders());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.renameFolder('f1', {name: 'Renamed'});
        });

        expect(result.current.folders.find(f => f.id === 'f1')?.name).toBe('Renamed');
    });

    it('sets error and rethrows on failure', async () => {
        mockFolderApi.getAll.mockResolvedValueOnce([folderA]);
        mockFolderApi.rename.mockRejectedValueOnce(new Error('Server error'));

        const {result} = renderHook(() => useFolders());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let thrown = false;
        await act(async () => {
            try {
                await result.current.renameFolder('f1', {name: 'x'});
            } catch {
                thrown = true;
            }
        });
        expect(thrown).toBe(true);
        expect(result.current.error).toBe('Failed to rename folder');
    });
});

describe('useFolders.deleteFolder', () => {
    it('removes folder from list', async () => {
        mockFolderApi.getAll.mockResolvedValueOnce([folderA, folderB]);
        mockFolderApi.delete.mockResolvedValueOnce(undefined);

        const {result} = renderHook(() => useFolders());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.deleteFolder('f1', 'delete');
        });

        expect(result.current.folders).toEqual([folderB]);
    });

    it('sets error and rethrows on failure', async () => {
        mockFolderApi.getAll.mockResolvedValueOnce([folderA]);
        mockFolderApi.delete.mockRejectedValueOnce(new Error('Server error'));

        const {result} = renderHook(() => useFolders());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let thrown = false;
        await act(async () => {
            try {
                await result.current.deleteFolder('f1', 'delete');
            } catch {
                thrown = true;
            }
        });
        expect(thrown).toBe(true);
        expect(result.current.error).toBe('Failed to delete folder');
    });
});
