import {API_BASE, apiFetch} from './apiFetch';
import type {Prompt} from '../types';

export const forkApi = {
    async fork(token: string): Promise<Prompt> {
        const response = await apiFetch(`${API_BASE}/fork/${token}`, {method: 'POST'});
        if (response.status === 410) throw new Error('This share link has expired or been revoked.');
        if (!response.ok) throw new Error('Failed to fork prompt');
        return response.json();
    },
};
