import {useEffect, useRef, useState} from 'react';
import {Sidebar} from './components/Sidebar';
import {PromptList} from './components/PromptList';
import {HomePage} from './components/HomePage';
import {AuthPage} from './components/AuthPage';
import {PublicSharePage} from './components/PublicSharePage';
import {ForgotPasswordPage} from './components/ForgotPasswordPage';
import {ResetPasswordPage} from './components/ResetPasswordPage';
import {useAuth} from './hooks/useAuth';

type View = 'home' | 'auth' | 'forgot-password' | 'app';

const SIDEBAR_COLLAPSED_KEY = 'pv:sidebar:collapsed';

function App() {
    const {user, loading, login, register, logout} = useAuth();
    const [view, setView] = useState<View>('home');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
        return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    });
    const newPromptRef = useRef<(() => void) | null>(null);

    const toggleSidebar = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
            return next;
        });
    };

    // Global keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === '\\') {
                    e.preventDefault();
                    toggleSidebar();
                } else if (e.key === 'k') {
                    e.preventDefault();
                    newPromptRef.current?.();
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Check if this is a public share URL: /share/:token
    const shareMatch = window.location.pathname.match(/^\/share\/([^/]+)$/);
    if (shareMatch) {
        return <PublicSharePage token={shareMatch[1]}/>;
    }

    // Check if this is a password reset URL: /reset-password?token=...
    if (window.location.pathname === '/reset-password') {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            return <ResetPasswordPage token={token} onSuccess={() => {
                window.history.replaceState(null, '', '/');
                setView('auth');
            }}/>;
        }
    }

    // Once we know the user is already logged in, go straight to app
    if (!loading && user && view !== 'app') {
        setView('app');
    }

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{background: 'var(--color-bg-base)'}}
            >
                <div className="text-sm" style={{color: 'var(--color-text-muted)'}}>Loading...</div>
            </div>
        );
    }

    if (view === 'home') {
        return <HomePage onGetStarted={() => setView('auth')}/>;
    }

    if (view === 'forgot-password') {
        return <ForgotPasswordPage onBack={() => setView('auth')}/>;
    }

    if (view === 'auth') {
        return (
            <AuthPage
                onLogin={async (email, password) => {
                    await login(email, password);
                    setView('app');
                }}
                onRegister={async (email, password) => {
                    await register(email, password);
                    setView('app');
                }}
                onBack={() => setView('home')}
                onForgotPassword={() => setView('forgot-password')}
            />
        );
    }

    return (
        <div className="flex h-screen" style={{background: 'var(--color-bg-base)'}}>
            <Sidebar
                onFolderSelect={id => {
                    setSelectedFolderId(id);
                    setSelectedTagId(null);
                }}
                selectedFolderId={selectedFolderId}
                onTagSelect={id => {
                    setSelectedTagId(id);
                    setSelectedFolderId(null);
                }}
                selectedTagId={selectedTagId}
                collapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebar}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header
                    className="shrink-0 flex items-center justify-between px-4"
                    style={{
                        height: '48px',
                        background: 'var(--color-bg-surface)',
                        borderBottom: '1px solid var(--color-border)',
                    }}
                >
                    <span className="text-sm" style={{color: 'var(--color-text-muted)'}}>{user?.email}</span>
                    <div className="flex items-center gap-3">
                        <span className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                            {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'} new &nbsp;·&nbsp;{' '}
                            {navigator.platform.includes('Mac') ? '⌘\\' : 'Ctrl+\\'} sidebar
                        </span>
                        <button
                            onClick={async () => {
                                await logout();
                                setView('home');
                            }}
                            className="text-sm bg-transparent border-none cursor-pointer px-2 py-1 rounded transition-colors"
                            style={{color: 'var(--color-text-secondary)'}}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                        >
                            Sign out
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden">
                    <PromptList
                        folderId={selectedFolderId}
                        tagId={selectedTagId}
                        onNewPromptRef={fn => {
                            newPromptRef.current = fn;
                        }}
                    />
                </main>
            </div>
        </div>
    );
}

export default App;
