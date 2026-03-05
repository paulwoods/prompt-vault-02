import {API_BASE, apiFetch} from './apiFetch';
import type {Prompt, PromptFilterParams, PromptRequest, PromptVersion} from '../types';

export const promptApi = {
    async getAll(): Promise<Prompt[]> {
        const response = await apiFetch(`${API_BASE}/prompts`);
        if (!response.ok) throw new Error('Failed to fetch prompts');
        return response.json();
    },

    async getById(id: string): Promise<Prompt> {
        const response = await apiFetch(`${API_BASE}/prompts/${id}`);
        if (!response.ok) throw new Error('Failed to fetch prompt');
        return response.json();
    },

    async create(data: PromptRequest): Promise<Prompt> {
        const response = await apiFetch(`${API_BASE}/prompts`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create prompt');
        return response.json();
    },

    async update(id: string, data: PromptRequest, rowVersion: number): Promise<Prompt> {
        const response = await apiFetch(`${API_BASE}/prompts/${id}?rowVersion=${rowVersion}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to save prompt');
        return response.json();
    },

    async delete(id: string): Promise<void> {
        const response = await apiFetch(`${API_BASE}/prompts/${id}`, {method: 'DELETE'});
        if (!response.ok) throw new Error('Failed to delete prompt');
    },

    async getVersions(promptId: string): Promise<PromptVersion[]> {
        const response = await apiFetch(`${API_BASE}/prompts/${promptId}/versions`);
        if (!response.ok) throw new Error('Failed to fetch versions');
        return response.json();
    },

    async restoreVersion(promptId: string, versionId: string): Promise<Prompt> {
        const response = await apiFetch(`${API_BASE}/prompts/${promptId}/versions/${versionId}/restore`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to restore version');
        return response.json();
    },

    async search(q: string): Promise<Prompt[]> {
        const params = new URLSearchParams({q});
        const response = await apiFetch(`${API_BASE}/prompts/search?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to search prompts');
        return response.json();
    },

    async filter(filters: PromptFilterParams): Promise<Prompt[]> {
        const params = new URLSearchParams();
        if (filters.folderId) params.append('folderId', filters.folderId);
        if (filters.tagId) params.append('tagId', filters.tagId);
        if (filters.favorite !== undefined) params.append('favorite', String(filters.favorite));

        const query = params.toString();
        const response = await apiFetch(`${API_BASE}/prompts/filter${query ? `?${query}` : ''}`);
        if (!response.ok) throw new Error('Failed to filter prompts');
        return response.json();
    },
};
