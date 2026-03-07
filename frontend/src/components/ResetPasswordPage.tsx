import React, {useState} from 'react';
import {authApi} from '../api/authApi';

interface ResetPasswordPageProps {
    token: string;
    onSuccess: () => void;
}

const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
    outline: 'none',
};

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({token, onSuccess}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            await authApi.confirmPasswordReset(token, newPassword);
            setDone(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong. The link may have expired.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{background: 'var(--color-bg-base)'}}>
            <nav style={{borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface)'}}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
                    <div className="flex items-center gap-2">
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
                    </div>
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
                        {done ? (
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
                                    Password updated
                                </h1>
                                <p className="text-sm mb-6" style={{color: 'var(--color-text-secondary)'}}>
                                    Your password has been reset successfully. You can now sign in with your new
                                    password.
                                </p>
                                <button
                                    onClick={onSuccess}
                                    className="w-full py-2.5 rounded-md text-sm font-medium border-none cursor-pointer transition-colors"
                                    style={{background: 'var(--color-accent)', color: '#0f1117'}}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                                >
                                    Sign in
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-xl font-bold mb-1" style={{color: 'var(--color-text-primary)'}}>
                                    Set new password
                                </h1>
                                <p className="text-sm mb-6" style={{color: 'var(--color-text-secondary)'}}>
                                    Choose a strong password of at least 8 characters.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1"
                                               style={{color: 'var(--color-text-secondary)'}}>
                                            New password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="w-full px-3 py-2 rounded-md text-sm"
                                            style={inputStyle}
                                            placeholder="At least 8 characters"
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1"
                                               style={{color: 'var(--color-text-secondary)'}}>
                                            Confirm new password
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
                                        {submitting ? 'Updating...' : 'Set new password'}
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
