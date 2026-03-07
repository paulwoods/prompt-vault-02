import {beforeEach, describe, expect, it, vi} from 'vitest';
import {act, renderHook, waitFor} from '@testing-library/react';
import {useAuth} from './useAuth';
import * as authApiModule from '../api/authApi';

vi.mock('../api/authApi', () => ({
    authApi: {
        me: vi.fn(),
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    },
}));

const mockAuthApi = authApiModule.authApi as {
    me: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
};

const sampleUser = {id: '1', email: 'a@b.com', createdAt: '2024-01-01'};

beforeEach(() => vi.clearAllMocks());

describe('useAuth initial state', () => {
    it('starts loading and resolves user', async () => {
        mockAuthApi.me.mockResolvedValueOnce(sampleUser);
        const {result} = renderHook(() => useAuth());

        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.user).toEqual(sampleUser);
    });

    it('resolves null user when not authenticated', async () => {
        mockAuthApi.me.mockResolvedValueOnce(null);
        const {result} = renderHook(() => useAuth());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.user).toBeNull();
    });
});

describe('useAuth.login', () => {
    it('sets user after login', async () => {
        mockAuthApi.me.mockResolvedValueOnce(null).mockResolvedValueOnce(sampleUser);
        mockAuthApi.login.mockResolvedValueOnce(undefined);

        const {result} = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.login('a@b.com', 'pw');
        });

        expect(result.current.user).toEqual(sampleUser);
    });
});

describe('useAuth.register', () => {
    it('sets user after register', async () => {
        mockAuthApi.me.mockResolvedValueOnce(null).mockResolvedValueOnce(sampleUser);
        mockAuthApi.register.mockResolvedValueOnce(sampleUser);
        mockAuthApi.login.mockResolvedValueOnce(undefined);

        const {result} = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.register('a@b.com', 'pw');
        });

        expect(result.current.user).toEqual(sampleUser);
    });
});

describe('useAuth.logout', () => {
    it('clears user after logout', async () => {
        mockAuthApi.me.mockResolvedValueOnce(sampleUser);
        mockAuthApi.logout.mockResolvedValueOnce(undefined);

        const {result} = renderHook(() => useAuth());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.user).toBeNull();
    });
});
