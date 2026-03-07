import React, {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import type {Prompt, PublicShare} from '../types';
import {shareLinkApi} from '../api/shareLinkApi';
import {forkApi} from '../api/forkApi';

interface PublicSharePageProps {
    token: string;
}

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
            <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--color-bg-base)'}}>
                <span className="text-sm" style={{color: 'var(--color-text-muted)'}}>Loading…</span>
            </div>
        );
    }

    if (error || !share) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{background: 'var(--color-bg-base)'}}>
                <div className="text-center max-w-sm">
                    <div className="text-4xl mb-3">{errorKind === 'gone' ? '⏰' : '🔍'}</div>
                    <h1 className="text-xl font-bold mb-2" style={{color: 'var(--color-text-primary)'}}>
                        {errorKind === 'gone' ? 'Link Unavailable' : 'Not Found'}
                    </h1>
                    <p className="text-sm mb-4" style={{color: 'var(--color-text-secondary)'}}>{error}</p>
                    <a
                        href="/"
                        className="inline-block text-sm px-4 py-2 rounded-md font-medium no-underline transition-colors"
                        style={{background: 'var(--color-accent)', color: '#0f1117'}}
                    >
                        Go to Prompt Vault
                    </a>
                </div>
            </div>
        );
    }

    const plainBody = share.body.replace(/<[^>]+>/g, '');

    return (
        <div className="min-h-screen" style={{background: 'var(--color-bg-base)'}}>
            {/* Header */}
            <header
                className="px-6 py-3 flex items-center justify-between"
                style={{
                    background: 'var(--color-bg-surface)',
                    borderBottom: '1px solid var(--color-border)',
                }}
            >
                <a href="/" className="font-bold text-lg no-underline" style={{color: 'var(--color-accent)'}}>
                    Prompt Vault
                </a>
                <div className="flex items-center gap-2">
                    <a
                        href={shareLinkApi.exportUrl(token)}
                        download
                        className="text-sm px-3 py-1.5 rounded-md font-medium no-underline transition-colors"
                        style={{
                            background: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                        }}
                    >
                        Export .txt
                    </a>
                    {forked ? (
                        <span className="text-sm font-medium" style={{color: '#4ade80'}}>
                            ✓ Forked — <a href="/" className="underline" style={{color: '#4ade80'}}>open in vault</a>
                        </span>
                    ) : (
                        <button
                            onClick={handleFork}
                            disabled={forking}
                            className="text-sm px-3 py-1.5 rounded-md font-medium border-none cursor-pointer transition-colors disabled:opacity-50"
                            style={{background: 'var(--color-accent)', color: '#0f1117'}}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                        >
                            {forking ? 'Forking…' : 'Fork to my vault'}
                        </button>
                    )}
                </div>
            </header>

            {forkError && (
                <div className="max-w-3xl mx-auto px-6 pt-4">
                    <div
                        className="rounded-lg px-4 py-2 text-sm"
                        style={{
                            background: 'rgba(224,82,82,0.1)',
                            border: '1px solid rgba(224,82,82,0.3)',
                            color: 'var(--color-danger)',
                        }}
                    >
                        {forkError} — <a href="/auth" className="underline" style={{color: 'var(--color-accent)'}}>
                        Sign in
                    </a> to fork prompts.
                    </div>
                </div>
            )}

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10">
                <div
                    className="rounded-xl p-8 shadow-2xl"
                    style={{
                        background: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    <h1 className="text-2xl font-bold mb-1" style={{color: 'var(--color-text-primary)'}}>
                        {share.title}
                    </h1>
                    <p className="text-xs mb-6" style={{color: 'var(--color-text-muted)'}}>
                        Shared {new Date(share.sharedAt).toLocaleString()}
                    </p>
                    <div className="prose prose-invert prose-sm max-w-none"
                         style={{color: 'var(--color-text-secondary)'}}>
                        <ReactMarkdown>{plainBody}</ReactMarkdown>
                    </div>
                </div>
            </main>
        </div>
    );
};
