import React, {useState} from 'react';
import {authApi} from '../api/authApi';

interface ForgotPasswordPageProps {
    onBack: () => void;
}

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
        <div className="min-h-screen bg-gray-50 flex flex-col">
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

            <div className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                        {sent ? (
                            <div className="text-center">
                                <div
                                    className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24"
                                         stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
                                <p className="text-sm text-gray-500 mb-6">
                                    If an account exists for <strong>{email}</strong>, you'll receive a password reset
                                    link shortly.
                                </p>
                                <button
                                    onClick={onBack}
                                    className="text-sm text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer"
                                >
                                    Back to sign in
                                </button>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h1>
                                <p className="text-sm text-gray-500 mb-6">
                                    Enter your email address and we'll send you a link to reset your password.
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

                                    {error && (
                                        <div
                                            className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
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
                                        className="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer mt-2"
                                    >
                                        {submitting ? 'Sending...' : 'Send reset link'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onBack}
                                        className="w-full text-sm text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer py-1"
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
