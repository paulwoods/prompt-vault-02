import {Tag, TagRequest} from '../types';

const API_BASE = '/api';

export const tagApi = {
    async getAll(): Promise<Tag[]> {
        const response = await fetch(`${API_BASE}/tags`);
        if (!response.ok) throw new Error('Failed to fetch tags');
        return response.json();
    },

    async create(tag: TagRequest): Promise<Tag> {
        const response = await fetch(`${API_BASE}/tags`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tag),
        });
        if (!response.ok) throw new Error('Failed to create tag');
        return response.json();
    },

    async update(id: string, tag: TagRequest): Promise<Tag> {
        const response = await fetch(`${API_BASE}/tags/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(tag),
        });
        if (!response.ok) throw new Error('Failed to update tag');
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/tags/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete tag');
    },
};
