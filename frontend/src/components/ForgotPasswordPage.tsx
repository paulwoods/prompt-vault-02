import React, {useState} from 'react';
import {authApi} from '../api/authApi';

interface ForgotPasswordPageProps {
    onBack: () => void;
}

const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    outline: 'none',
};

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({onBack}) => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await authApi.requestPasswordReset(email);
            setSent(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{background: 'var(--color-bg-base)'}}>
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

            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md">
                    <div
                        className="rounded-xl p-8 shadow-2xl"
                        style={{
                            background: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        {sent ? (
                            <div className="text-center">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                                    style={{background: 'rgba(74,222,128,0.15)'}}
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                         style={{color: '#4ade80'}}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <h1 className="text-xl font-bold mb-2" style={{color: 'var(--color-text-primary)'}}>
                                    Check your email
                                </h1>
                                <p className="text-sm mb-6" style={{color: 'var(--color-text-secondary)'}}>
                                    If an account exists for <strong>{email}</strong>, you'll receive a password reset
                                    link shortly.
                                </p>
                                <button
                                    onClick={onBack}
                                    className="text-sm bg-transparent border-none cursor-pointer transition-colors"
                                    style={{color: 'var(--color-accent)'}}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                                >
                                    Back to sign in
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-xl font-bold mb-1" style={{color: 'var(--color-text-primary)'}}>
                                    Reset your password
                                </h1>
                                <p className="text-sm mb-6" style={{color: 'var(--color-text-secondary)'}}>
                                    Enter your email address and we'll send you a link to reset your password.
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

                                    {error && (
                                        <div
                                            className="flex items-start gap-2 text-sm px-3 py-2 rounded-md"
                                            style={{
                                                background: 'rgba(224,82,82,0.1)',
                                                border: '1px solid rgba(224,82,82,0.3)',
                                                color: 'var(--color-danger)',
                                            }}
                                        >
                                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor"
                                                 viewBox="0 0 20 20">
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
                                        {submitting ? 'Sending...' : 'Send reset link'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onBack}
                                        className="w-full text-sm bg-transparent border-none cursor-pointer py-1 transition-colors"
                                        style={{color: 'var(--color-text-secondary)'}}
                                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                                    >
                                        Back to sign in
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
