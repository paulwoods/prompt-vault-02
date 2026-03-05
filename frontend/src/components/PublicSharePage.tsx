import React, {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import type {Prompt, PublicShare} from '../types';
import {shareLinkApi} from '../api/shareLinkApi';
import {forkApi} from '../api/forkApi';

interface PublicSharePageProps {
    token: string;
}

// PV-112: distinguish between expired/revoked and truly not found
type ErrorKind = 'not_found' | 'gone';

export const PublicSharePage: React.FC<PublicSharePageProps> = ({token}) => {
    const [share, setShare] = useState<PublicShare | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorKind, setErrorKind] = useState<ErrorKind>('not_found');
    const [forking, setForking] = useState(false);
    const [forked, setForked] = useState<Prompt | null>(null);
    const [forkError, setForkError] = useState<string | null>(null);

    useEffect(() => {
        shareLinkApi.getPublic(token)
            .then(setShare)
            .catch(async () => {
                // Re-fetch to distinguish 404 vs 410
                try {
                    const res = await fetch(`/promptvault/api/share/${token}`);
                    if (res.status === 410) {
                        setErrorKind('gone');
                        setError('This share link has expired or been revoked.');
                    } else {
                        setErrorKind('not_found');
                        setError('This link is invalid or no longer available.');
                    }
                } catch {
                    setErrorKind('not_found');
                    setError('This link is invalid or no longer available.');
                }
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleFork = async () => {
        setForking(true);
        setForkError(null);
        try {
            const result = await forkApi.fork(token);
            setForked(result);
        } catch (e: unknown) {
            setForkError(e instanceof Error ? e.message : 'Fork failed');
        } finally {
            setForking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <span className="text-gray-400 text-sm">Loading…</span>
            </div>
        );
    }

    if (error || !share) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm">
                    {/* PV-112: different icon/message for expired vs not found */}
                    <div className="text-4xl mb-3">{errorKind === 'gone' ? '⏰' : '🔍'}</div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">
                        {errorKind === 'gone' ? 'Link Unavailable' : 'Not Found'}
                    </h1>
                    <p className="text-gray-500 text-sm mb-4">{error}</p>
                    <a
                        href="/"
                        className="inline-block text-sm bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700 transition-colors no-underline"
                    >
                        Go to Prompt Vault
                    </a>
                </div>
            </div>
        );
    }

    const plainBody = share.body.replace(/<[^>]+>/g, '');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
                <a href="/" className="text-yellow-400 font-bold text-lg no-underline">
                    Prompt Vault
                </a>
                <div className="flex items-center gap-2">
                    <a
                        href={shareLinkApi.exportUrl(token)}
                        download
                        className="text-sm border border-gray-600 text-gray-300 px-3 py-1.5 rounded-md font-medium hover:bg-gray-800 transition-colors no-underline"
                    >
                        Export .txt
                    </a>
                    {/* Fork button — shown when logged in (attempt will redirect if not) */}
                    {forked ? (
                        <span className="text-sm text-green-400 font-medium">
                            ✓ Forked — <a href="/" className="underline text-green-300">open in vault</a>
                        </span>
                    ) : (
                        <button
                            onClick={handleFork}
                            disabled={forking}
                            className="text-sm bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-md font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50 border-none cursor-pointer"
                        >
                            {forking ? 'Forking…' : 'Fork to my vault'}
                        </button>
                    )}
                </div>
            </header>

            {forkError && (
                <div className="max-w-3xl mx-auto px-6 pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
                        {forkError} — <a href="/auth" className="underline">Sign in</a> to fork prompts.
                    </div>
                </div>
            )}

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{share.title}</h1>
                    <p className="text-xs text-gray-400 mb-6">
                        Shared {new Date(share.sharedAt).toLocaleString()}
                    </p>
                    <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>{plainBody}</ReactMarkdown>
                    </div>
                </div>
            </main>
        </div>
    );
};
