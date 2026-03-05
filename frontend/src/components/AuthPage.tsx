import React, {useState} from 'react';

interface AuthPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string) => Promise<void>;
    onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({onLogin, onRegister, onBack}) => {
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
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* Nav */}
            <nav className="border-b border-gray-200 bg-white">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
                    >
                        <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fillRule="evenodd"
                                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 000-2h-3z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                        <span className="font-semibold text-gray-900 text-lg">Prompt Vault</span>
                    </button>
                </div>
            </nav>

            {/* Form card */}
            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">

                        {/* Tabs */}
                        <div className="flex border border-gray-200 rounded-lg p-1 mb-8">
                            <button
                                type="button"
                                onClick={() => switchMode('login')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors border-none cursor-pointer
                                    ${mode === 'login'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                onClick={() => switchMode('register')}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors border-none cursor-pointer
                                    ${mode === 'register'
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Create account
                            </button>
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 mb-1">
                            {mode === 'login' ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p className="text-sm text-gray-500 mb-6">
                            {mode === 'login'
                                ? 'Sign in to access your prompt vault.'
                                : 'Get started — it only takes a moment.'}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder="you@company.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                    placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                                />
                            </div>

                            {mode === 'register' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            {error && (
                                <div
                                    className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
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
                                className="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer mt-2"
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
