import {useCallback, useEffect, useState} from 'react';
import type {UserResponse} from '../api/authApi';
import {authApi} from '../api/authApi';

export function useAuth() {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authApi.me()
            .then(setUser)
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        await authApi.login({email, password});
        const me = await authApi.me();
        setUser(me);
    }, []);

    const register = useCallback(async (email: string, password: string) => {
        await authApi.register({email, password});
        await authApi.login({email, password});
        const me = await authApi.me();
        setUser(me);
    }, []);

    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
    }, []);

    return {user, loading, login, register, logout};
}
