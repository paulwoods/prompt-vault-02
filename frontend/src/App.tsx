import {useState} from 'react';
import {Sidebar} from './components/Sidebar';
import {PromptList} from './components/PromptList';
import {HomePage} from './components/HomePage';
import {AuthPage} from './components/AuthPage';
import {PublicSharePage} from './components/PublicSharePage';
import {ForgotPasswordPage} from './components/ForgotPasswordPage';
import {ResetPasswordPage} from './components/ResetPasswordPage';
import {useAuth} from './hooks/useAuth';

type View = 'home' | 'auth' | 'forgot-password' | 'app';

function App() {
    const {user, loading, login, register, logout} = useAuth();
    const [view, setView] = useState<View>('home');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

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
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-400 text-sm">Loading...</div>
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
        <div className="flex h-screen bg-gray-50">
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
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header
                    className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                    <span className="text-sm text-gray-500">{user?.email}</span>
                    <button
                        onClick={async () => {
                            await logout();
                            setView('home');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-900 bg-transparent border-none cursor-pointer px-2 py-1"
                    >
                        Sign out
                    </button>
                </header>
                <main className="flex-1 overflow-hidden">
                    <PromptList
                        folderId={selectedFolderId}
                        tagId={selectedTagId}
                    />
                </main>
            </div>
        </div>
    );
}

export default App;
