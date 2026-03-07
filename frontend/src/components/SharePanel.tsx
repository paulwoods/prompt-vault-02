import React, {useEffect, useState} from 'react';
import type {ShareLink} from '../types';
import {shareLinkApi} from '../api/shareLinkApi';

interface SharePanelProps {
    promptId: string;
}

export const SharePanel: React.FC<SharePanelProps> = ({promptId}) => {
    const [links, setLinks] = useState<ShareLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [emailInput, setEmailInput] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    useEffect(() => {
        shareLinkApi.list(promptId)
            .then(setLinks)
            .catch(() => setError('Failed to load share links'))
            .finally(() => setLoading(false));
    }, [promptId]);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        try {
            const link = await shareLinkApi.create(promptId);
            setLinks(prev => [link, ...prev]);
        } catch {
            setError('Failed to create share link');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (id: string) => {
        try {
            await shareLinkApi.revoke(id);
            setLinks(prev => prev.filter(l => l.id !== id));
        } catch {
            setError('Failed to revoke share link');
        }
    };

    const handleCopy = async (link: ShareLink) => {
        const url = `${window.location.origin}/share/${link.token}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(link.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleEmailShare = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError(null);
        setEmailSuccess(false);
        setSendingEmail(true);
        try {
            await shareLinkApi.emailShare(promptId, emailInput);
            setEmailSuccess(true);
            setEmailInput('');
        } catch {
            setEmailError('Failed to send email. Please try again.');
        } finally {
            setSendingEmail(false);
        }
    };

    const shareUrl = (token: string) => `${window.location.origin}/share/${token}`;

    return (
        <div className="flex flex-col h-full overflow-y-auto p-6" style={{background: 'var(--color-bg-base)'}}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold" style={{color: 'var(--color-text-primary)'}}>
                        Share Links
                    </h2>
                    <p className="text-xs mt-0.5" style={{color: 'var(--color-text-muted)'}}>
                        Anyone with the link can view this prompt
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="text-sm px-3 py-1.5 rounded-md font-medium border-none cursor-pointer transition-colors disabled:opacity-50"
                    style={{background: 'var(--color-accent)', color: '#0f1117'}}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                >
                    {creating ? 'Creating…' : '+ New link'}
                </button>
            </div>

            {/* Email share */}
            <div
                className="mb-5 rounded-lg p-3"
                style={{
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-surface)',
                }}
            >
                <p className="text-xs font-medium mb-2" style={{color: 'var(--color-text-secondary)'}}>
                    Share via email
                </p>
                <form onSubmit={handleEmailShare} className="flex gap-2">
                    <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="recipient@example.com"
                        className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md text-xs"
                        style={{
                            background: 'var(--color-bg-elevated)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                            outline: 'none',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    />
                    <button
                        type="submit"
                        disabled={sendingEmail}
                        className="text-xs px-3 py-1.5 rounded-md font-medium border-none cursor-pointer transition-colors disabled:opacity-50 shrink-0"
                        style={{background: 'var(--color-accent)', color: '#0f1117'}}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                    >
                        {sendingEmail ? 'Sending…' : 'Send'}
                    </button>
                </form>
                {emailSuccess && (
                    <p className="text-xs mt-1.5" style={{color: '#4ade80'}}>Email sent successfully!</p>
                )}
                {emailError && (
                    <p className="text-xs mt-1.5" style={{color: 'var(--color-danger)'}}>{emailError}</p>
                )}
            </div>

            {error && (
                <p className="text-xs mb-3" style={{color: 'var(--color-danger)'}}>{error}</p>
            )}

            {loading ? (
                <p className="text-xs" style={{color: 'var(--color-text-muted)'}}>Loading…</p>
            ) : links.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm"
                     style={{color: 'var(--color-text-muted)'}}>
                    No share links yet. Create one to share this prompt.
                </div>
            ) : (
                <ul className="space-y-2">
                    {links.map(link => (
                        <li
                            key={link.id}
                            className="rounded-lg p-3"
                            style={{
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className="inline-block w-1.5 h-1.5 rounded-full"
                                            style={{background: link.active ? '#4ade80' : 'var(--color-text-muted)'}}
                                        />
                                        <span
                                            className="text-xs font-mono truncate"
                                            style={{color: 'var(--color-text-muted)'}}
                                        >
                                            {shareUrl(link.token)}
                                        </span>
                                    </div>
                                    <div className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                                        Created {new Date(link.createdAt).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                    })}
                                        {link.expiresAt && (
                                            <span className="ml-2">
                                                · Expires {new Date(link.expiresAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => handleCopy(link)}
                                        className="text-xs px-2 py-1 rounded cursor-pointer transition-colors border-none"
                                        style={{
                                            background: copiedId === link.id
                                                ? 'var(--color-accent-dim)'
                                                : 'var(--color-bg-elevated)',
                                            color: copiedId === link.id
                                                ? 'var(--color-accent)'
                                                : 'var(--color-text-secondary)',
                                            border: `1px solid ${copiedId === link.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                        }}
                                    >
                                        {copiedId === link.id ? 'Copied!' : 'Copy'}
                                    </button>
                                    <a
                                        href={shareLinkApi.exportUrl(link.token)}
                                        download
                                        className="text-xs px-2 py-1 rounded no-underline transition-colors"
                                        style={{
                                            background: 'var(--color-bg-elevated)',
                                            color: 'var(--color-text-secondary)',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        Export
                                    </a>
                                    <button
                                        onClick={() => handleRevoke(link.id)}
                                        className="text-xs px-2 py-1 rounded cursor-pointer bg-transparent transition-colors"
                                        style={{
                                            color: 'var(--color-danger)',
                                            border: '1px solid var(--color-danger)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,82,82,0.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
