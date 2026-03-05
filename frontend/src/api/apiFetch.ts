export const API_BASE = '/promptvault/api';

export function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...init,
        credentials: 'include',
        headers: {
            ...init.headers,
        },
    });
}
