import React, {useState} from 'react';
import {usePromptSearch} from '../hooks/usePromptSearch';
import {PromptEditor} from './PromptEditor';
import {promptApi} from '../api/promptApi';
import type {Prompt, PromptFilterParams} from '../types';

interface PromptListProps {
    folderId: string | null;
    tagId: string | null;
}

export const PromptList: React.FC<PromptListProps> = ({folderId, tagId}) => {
    const {prompts, loading, error, searchQuery, setSearchQuery, setFilters, refresh} = usePromptSearch();
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [creating, setCreating] = useState(false);

    React.useEffect(() => {
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
                folderId: folderId ?? undefined,
            });
            refresh();
            setSelectedPrompt(created);
        } finally {
            setCreating(false);
        }
    };

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
        <div className="flex flex-col h-full">
            {/* Search + New */}
            <div className="p-4 border-b border-gray-200 flex gap-2">
                <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Search prompts…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <button
                    onClick={handleNewPrompt}
                    disabled={creating}
                    className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-700 transition-colors border-none cursor-pointer font-medium whitespace-nowrap disabled:opacity-50"
                >
                    + New
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && <p className="text-sm text-gray-400">Loading…</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
                {!loading && !error && prompts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-sm mb-3">No prompts yet.</p>
                        <button
                            onClick={handleNewPrompt}
                            className="text-sm text-gray-900 font-medium underline bg-transparent border-none cursor-pointer"
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
                            className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-gray-300 cursor-pointer transition-all"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-gray-900 text-sm truncate">{prompt.title}</span>
                                {prompt.isFavorite && (
                                    <span className="text-yellow-400 shrink-0">★</span>
                                )}
                            </div>
                            {prompt.currentBody && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                    {prompt.currentBody.replace(/<[^>]+>/g, '').slice(0, 100)}
                                </p>
                            )}
                            {prompt.tagIds.length > 0 && (
                                <div className="mt-1.5 flex gap-1 flex-wrap">
                                    {prompt.tagIds.map(id => (
                                        <span key={id}
                                              className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
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
