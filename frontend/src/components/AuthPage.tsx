import React, {useState} from 'react';

interface AuthPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string) => Promise<void>;
    onBack: () => void;
    onForgotPassword?: () => void;
}

const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    outline: 'none',
};

export const AuthPage: React.FC<AuthPageProps> = ({onLogin, onRegister, onBack, onForgotPassword}) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === 'register') {
            if (password.length < 8) {
                setError('Password must be at least 8 characters.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }
        }

        setSubmitting(true);
        try {
            if (mode === 'login') {
                await onLogin(email, password);
            } else {
                await onRegister(email, password);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setSubmitting(false);
        }
    };

    const switchMode = (next: 'login' | 'register') => {
        setMode(next);
        setError(null);
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="min-h-screen flex flex-col" style={{background: 'var(--color-bg-base)'}}>

            {/* Nav */}
            <nav style={{borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface)'}}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
                    >
                        <div
                            className="w-8 h-8 rounded-md flex items-center justify-center"
                            style={{background: 'var(--color-accent)'}}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{color: '#0f1117'}}>
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fillRule="evenodd"
                                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 000-2h-3z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                        <span className="font-semibold text-lg" style={{color: 'var(--color-accent)'}}>
                            Prompt Vault
                        </span>
                    </button>
                </div>
            </nav>

            {/* Form card */}
            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md">
                    <div
                        className="rounded-xl p-8 shadow-2xl"
                        style={{
                            background: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        {/* Tabs */}
                        <div
                            className="flex rounded-lg p-1 mb-8"
                            style={{background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)'}}
                        >
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className="flex-1 py-2 text-sm font-medium rounded-md transition-colors border-none cursor-pointer"
                                style={{
                                    background: mode === 'login' ? 'var(--color-accent)' : 'transparent',
                                    color: mode === 'login' ? '#0f1117' : 'var(--color-text-secondary)',
                                }}
                            >
                                Sign in now
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('register')}
                                className="flex-1 py-2 text-sm font-medium rounded-md transition-colors border-none cursor-pointer"
                                style={{
                                    background: mode === 'register' ? 'var(--color-accent)' : 'transparent',
                                    color: mode === 'register' ? '#0f1117' : 'var(--color-text-secondary)',
                                }}
                            >
                                Create an account
                            </button>
                        </div>

                        <h1 className="text-xl font-bold mb-1" style={{color: 'var(--color-text-primary)'}}>
                            {mode === 'login' ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p className="text-sm mb-6" style={{color: 'var(--color-text-secondary)'}}>
                            {mode === 'login'
                                ? 'Sign in to access your prompt vault.'
                                : 'Get started — it only takes a moment.'}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1"
                                       style={{color: 'var(--color-text-secondary)'}}>
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md text-sm"
                                    style={inputStyle}
                                    placeholder="you@company.com"
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium"
                                           style={{color: 'var(--color-text-secondary)'}}>
                                        Password
                                    </label>
                                    {mode === 'login' && onForgotPassword && (
                                        <button
                                            type="button"
                                            onClick={onForgotPassword}
                                            className="text-xs bg-transparent border-none cursor-pointer p-0 transition-colors"
                                            style={{color: 'var(--color-accent)'}}
                                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent-hover)')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    required
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md text-sm"
                                    style={inputStyle}
                                    placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                                />
                            </div>

                            {mode === 'register' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1"
                                           style={{color: 'var(--color-text-secondary)'}}>
                                        Confirm password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md text-sm"
                                        style={inputStyle}
                                        placeholder="••••••••"
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                                    />
                                </div>
                            )}

                            {error && (
                                <div
                                    className="flex items-start gap-2 text-sm px-3 py-2 rounded-md"
                                    style={{
                                        background: 'rgba(224,82,82,0.1)',
                                        border: '1px solid rgba(224,82,82,0.3)',
                                        color: 'var(--color-danger)',
                                    }}
                                >
                                    <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd"
                                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                              clipRule="evenodd"/>
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer mt-2"
                                style={{background: 'var(--color-accent)', color: '#0f1117'}}
                                onMouseEnter={e => {
                                    if (!submitting) e.currentTarget.style.background = 'var(--color-accent-hover)';
                                }}
                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                            >
                                {submitting
                                    ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                                    : (mode === 'login' ? 'Sign in' : 'Create account')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
