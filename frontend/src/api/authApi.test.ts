import {beforeEach, describe, expect, it, vi} from 'vitest';
import {authApi} from './authApi';
import * as apiFetchModule from './apiFetch';

const mockApiFetch = vi.spyOn(apiFetchModule, 'apiFetch');

function makeResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {'Content-Type': 'application/json'},
    });
}

describe('authApi.register', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns user on success', async () => {
        const user = {id: '1', email: 'a@b.com', createdAt: '2024-01-01'};
        mockApiFetch.mockResolvedValueOnce(makeResponse(user));

        const result = await authApi.register({email: 'a@b.com', password: 'pw'});
        expect(result).toEqual(user);
    });

    it('throws with server message on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({message: 'Email taken'}, 409));

        await expect(authApi.register({email: 'a@b.com', password: 'pw'})).rejects.toThrow('Email taken');
    });

    it('throws generic message when no server message', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 400));

        await expect(authApi.register({email: 'a@b.com', password: 'pw'})).rejects.toThrow('Registration failed');
    });
});

describe('authApi.login', () => {
    beforeEach(() => vi.clearAllMocks());

    it('resolves on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await expect(authApi.login({email: 'a@b.com', password: 'pw'})).resolves.toBeUndefined();
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 401));
        await expect(authApi.login({email: 'a@b.com', password: 'pw'})).rejects.toThrow('Invalid email or password');
    });
});

describe('authApi.logout', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls logout endpoint', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await authApi.logout();
        expect(mockApiFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.objectContaining({method: 'POST'}));
    });
});

describe('authApi.me', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns user when ok', async () => {
        const user = {id: '1', email: 'a@b.com', createdAt: '2024-01-01'};
        mockApiFetch.mockResolvedValueOnce(makeResponse(user, 200));
        const result = await authApi.me();
        expect(result).toEqual(user);
    });

    it('returns null when not ok', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 401));
        const result = await authApi.me();
        expect(result).toBeNull();
    });
});

describe('authApi.requestPasswordReset', () => {
    beforeEach(() => vi.clearAllMocks());

    it('resolves on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await expect(authApi.requestPasswordReset('a@b.com')).resolves.toBeUndefined();
    });

    it('throws on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 500));
        await expect(authApi.requestPasswordReset('a@b.com')).rejects.toThrow('Failed to send password reset email');
    });
});

describe('authApi.confirmPasswordReset', () => {
    beforeEach(() => vi.clearAllMocks());

    it('resolves on success', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 200));
        await expect(authApi.confirmPasswordReset('token123', 'newPw')).resolves.toBeUndefined();
    });

    it('throws with server message on failure', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({message: 'Token expired'}, 400));
        await expect(authApi.confirmPasswordReset('token123', 'newPw')).rejects.toThrow('Token expired');
    });

    it('throws generic message when no server message', async () => {
        mockApiFetch.mockResolvedValueOnce(makeResponse({}, 400));
        await expect(authApi.confirmPasswordReset('token123', 'newPw')).rejects.toThrow('Invalid or expired reset token');
    });
});
