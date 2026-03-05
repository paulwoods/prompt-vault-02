import type {Prompt, PromptFilterParams} from '../types';

const API_BASE = '/promptvault/api';

export const promptApi = {
    async getAll(): Promise<Prompt[]> {
        const response = await fetch(`${API_BASE}/prompts`);
        if (!response.ok) throw new Error('Failed to fetch prompts');
        return response.json();
    },

    async search(q: string): Promise<Prompt[]> {
        const params = new URLSearchParams({q});
        const response = await fetch(`${API_BASE}/prompts/search?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to search prompts');
        return response.json();
    },

    async filter(filters: PromptFilterParams): Promise<Prompt[]> {
        const params = new URLSearchParams();
        if (filters.folderId) params.append('folderId', filters.folderId);
        if (filters.tagId) params.append('tagId', filters.tagId);
        if (filters.favorite !== undefined) params.append('favorite', String(filters.favorite));

        const query = params.toString();
        const response = await fetch(`${API_BASE}/prompts/filter${query ? `?${query}` : ''}`);
        if (!response.ok) throw new Error('Failed to filter prompts');
        return response.json();
    },
};
