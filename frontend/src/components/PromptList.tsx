import React, {useEffect, useRef, useState} from 'react';
import {usePromptSearch} from '../hooks/usePromptSearch';
import {PromptEditor} from './PromptEditor';
import {promptApi} from '../api/promptApi';
import type {Prompt, PromptFilterParams} from '../types';

interface PromptListProps {
    folderId: string | null;
    tagId: string | null;
    onNewPromptRef?: (fn: () => void) => void;
}

export const PromptList: React.FC<PromptListProps> = ({folderId, tagId, onNewPromptRef}) => {
    const {prompts, loading, error, searchQuery, setSearchQuery, setFilters, refresh} = usePromptSearch();
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [creating, setCreating] = useState(false);
    const folderIdRef = useRef(folderId);

    useEffect(() => {
        folderIdRef.current = folderId;
    }, [folderId]);

    useEffect(() => {
        const newFilters: PromptFilterParams = {};
        if (folderId) newFilters.folderId = folderId;
        if (tagId) newFilters.tagId = tagId;
        setFilters(newFilters);
    }, [folderId, tagId, setFilters]);

    const handleNewPrompt = async () => {
        setCreating(true);
        try {
            const created = await promptApi.create({
                title: 'New Prompt',
                currentBody: 'todo',
                isFavorite: false,
                folderId: folderIdRef.current ?? undefined,
            });
            refresh();
            setSelectedPrompt(created);
        } finally {
            setCreating(false);
        }
    };

    // Expose handleNewPrompt to parent for Cmd+K
    useEffect(() => {
        onNewPromptRef?.(handleNewPrompt);
    }, [onNewPromptRef]);

    if (selectedPrompt) {
        return (
            <PromptEditor
                prompt={selectedPrompt}
                onSaved={updated => setSelectedPrompt(updated)}
                onClose={() => {
                    setSelectedPrompt(null);
                    refresh();
                }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full" style={{background: 'var(--color-bg-base)'}}>
            {/* Search + New */}
            <div
                className="p-4 flex gap-2 shrink-0"
                style={{borderBottom: '1px solid var(--color-border)'}}
            >
                <input
                    type="text"
                    className="flex-1 px-3 py-2 rounded-md text-sm"
                    style={{
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        outline: 'none',
                    }}
                    placeholder="Search prompts…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
                <button
                    onClick={handleNewPrompt}
                    disabled={creating}
                    className="text-sm px-4 py-2 rounded-md font-medium border-none cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                    style={{
                        background: 'var(--color-accent)',
                        color: '#0f1117',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                >
                    + New
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                    <p className="text-sm" style={{color: 'var(--color-text-muted)'}}>Loading…</p>
                )}
                {error && <p className="text-sm" style={{color: 'var(--color-danger)'}}>{error}</p>}
                {!loading && !error && prompts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-sm mb-3" style={{color: 'var(--color-text-muted)'}}>
                            No prompts yet.
                        </p>
                        <button
                            onClick={handleNewPrompt}
                            className="text-sm font-medium underline bg-transparent border-none cursor-pointer"
                            style={{color: 'var(--color-accent)'}}
                        >
                            Create your first prompt
                        </button>
                    </div>
                )}
                <ul className="space-y-2">
                    {prompts.map(prompt => (
                        <li
                            key={prompt.id}
                            onClick={() => setSelectedPrompt(prompt)}
                            className="p-3 rounded-lg cursor-pointer transition-all"
                            style={{
                                background: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border)',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLLIElement).style.borderColor = 'var(--color-accent)';
                                (e.currentTarget as HTMLLIElement).style.boxShadow = '0 0 0 1px var(--color-accent-dim)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLLIElement).style.borderColor = 'var(--color-border)';
                                (e.currentTarget as HTMLLIElement).style.boxShadow = 'none';
                            }}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className="font-medium text-sm truncate"
                                    style={{color: 'var(--color-text-primary)'}}
                                >
                                    {prompt.title}
                                </span>
                                {prompt.isFavorite && (
                                    <span className="shrink-0" style={{color: 'var(--color-accent)'}}>★</span>
                                )}
                            </div>
                            {prompt.currentBody && (
                                <p className="text-xs mt-1 truncate" style={{color: 'var(--color-text-muted)'}}>
                                    {prompt.currentBody.replace(/<[^>]+>/g, '').slice(0, 100)}
                                </p>
                            )}
                            {prompt.tagIds.length > 0 && (
                                <div className="mt-1.5 flex gap-1 flex-wrap">
                                    {prompt.tagIds.map(id => (
                                        <span
                                            key={id}
                                            className="text-xs px-1.5 py-0.5 rounded"
                                            style={{
                                                background: 'var(--color-accent-dim)',
                                                color: 'var(--color-accent)',
                                            }}
                                        >
                                            tag
                                        </span>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
