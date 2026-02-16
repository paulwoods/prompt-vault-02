import {DeleteFolderMode, Folder, FolderRequest} from '../types';

const API_BASE = '/api';

export const folderApi = {
    async getAll(): Promise<Folder[]> {
        const response = await fetch(`${API_BASE}/folders`);
        if (!response.ok) throw new Error('Failed to fetch folders');
        return response.json();
    },

    async create(folder: FolderRequest): Promise<Folder> {
        const response = await fetch(`${API_BASE}/folders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(folder),
        });
        if (!response.ok) throw new Error('Failed to create folder');
        return response.json();
    },

    async rename(id: string, folder: FolderRequest): Promise<Folder> {
        const response = await fetch(`${API_BASE}/folders/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(folder),
        });
        if (!response.ok) throw new Error('Failed to rename folder');
        return response.json();
    },

    async delete(id: string, mode: DeleteFolderMode, targetFolderId?: string): Promise<void> {
        const params = new URLSearchParams({mode});
        if (targetFolderId) params.append('targetFolderId', targetFolderId);

        const response = await fetch(`${API_BASE}/folders/${id}?${params.toString()}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete folder');
    },
};
