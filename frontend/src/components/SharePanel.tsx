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

    const shareUrl = (token: string) => `${window.location.origin}/share/${token}`;

    return (
        <div className="flex flex-col h-full overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-sm font-semibold text-gray-900">Share Links</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Anyone with the link can view this prompt</p>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 border-none cursor-pointer"
                >
                    {creating ? 'Creating…' : '+ New link'}
                </button>
            </div>

            {error && (
                <p className="text-xs text-red-500 mb-3">{error}</p>
            )}

            {loading ? (
                <p className="text-xs text-gray-400">Loading…</p>
            ) : links.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No share links yet. Create one to share this prompt.
                </div>
            ) : (
                <ul className="space-y-2">
                    {links.map(link => (
                        <li key={link.id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span
                                            className={`inline-block w-1.5 h-1.5 rounded-full ${link.active ? 'bg-green-400' : 'bg-gray-300'}`}/>
                                        <span className="text-xs text-gray-500 font-mono truncate">
                                            {shareUrl(link.token)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
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
                                        className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        {copiedId === link.id ? 'Copied!' : 'Copy'}
                                    </button>
                                    <a
                                        href={shareLinkApi.exportUrl(link.token)}
                                        download
                                        className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors no-underline"
                                    >
                                        Export
                                    </a>
                                    <button
                                        onClick={() => handleRevoke(link.id)}
                                        className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-transparent"
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
