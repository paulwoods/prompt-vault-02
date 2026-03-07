import {API_BASE, apiFetch} from './apiFetch';

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface UserResponse {
    id: string;
    email: string;
    createdAt: string;
}

export const authApi = {
    async register(data: RegisterRequest): Promise<UserResponse> {
        const response = await apiFetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message ?? 'Registration failed');
        }
        return response.json();
    },

    async login(data: LoginRequest): Promise<void> {
        const response = await apiFetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Invalid email or password');
        }
    },

    async logout(): Promise<void> {
        await apiFetch(`${API_BASE}/auth/logout`, {method: 'POST'});
    },

    async me(): Promise<UserResponse | null> {
        const response = await apiFetch(`${API_BASE}/me`);
        if (!response.ok) return null;
        return response.json();
    },

    async requestPasswordReset(email: string): Promise<void> {
        const response = await apiFetch(`${API_BASE}/auth/password-reset/request`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email}),
        });
        if (!response.ok) throw new Error('Failed to send password reset email');
    },

    async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
        const response = await apiFetch(`${API_BASE}/auth/password-reset/confirm`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({token, newPassword}),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error((body as { message?: string }).message ?? 'Invalid or expired reset token');
        }
    },
};
