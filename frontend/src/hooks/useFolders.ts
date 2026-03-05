import {useEffect, useState} from 'react';
import {folderApi} from '../api/folderApi';
import type {DeleteFolderMode, Folder, FolderRequest} from '../types';

export function useFolders() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFolders = async () => {
        try {
            setLoading(true);
            const data = await folderApi.getAll();
            setFolders(data);
            setError(null);
        } catch (err) {
            setError('Failed to load folders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

    const createFolder = async (request: FolderRequest) => {
        try {
            const newFolder = await folderApi.create(request);
            setFolders([...folders, newFolder]);
            return newFolder;
        } catch (err) {
            setError('Failed to create folder');
            throw err;
        }
    };

    const renameFolder = async (id: string, request: FolderRequest) => {
        try {
            const updatedFolder = await folderApi.rename(id, request);
            setFolders(folders.map(f => f.id === id ? updatedFolder : f));
            return updatedFolder;
        } catch (err) {
            setError('Failed to rename folder');
            throw err;
        }
    };

    const deleteFolder = async (id: string, mode: DeleteFolderMode, targetFolderId?: string) => {
        try {
            await folderApi.delete(id, mode, targetFolderId);
            setFolders(folders.filter(f => f.id !== id));
        } catch (err) {
            setError('Failed to delete folder');
            throw err;
        }
    };

    return {folders, loading, error, createFolder, renameFolder, deleteFolder, refreshFolders: fetchFolders};
}
