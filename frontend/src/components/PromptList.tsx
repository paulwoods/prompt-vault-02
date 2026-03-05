import React from 'react';
import {usePromptSearch} from '../hooks/usePromptSearch';
import type {PromptFilterParams} from '../types';

interface PromptListProps {
    folderId: string | null;
    tagId: string | null;
}

export const PromptList: React.FC<PromptListProps> = ({folderId, tagId}) => {
    const {prompts, loading, error, searchQuery, setSearchQuery, setFilters} = usePromptSearch();

    React.useEffect(() => {
        const newFilters: PromptFilterParams = {};
        if (folderId) newFilters.folderId = folderId;
        if (tagId) newFilters.tagId = tagId;
        setFilters(newFilters);
    }, [folderId, tagId, setFilters]);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading && <p className="text-gray-500">Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && prompts.length === 0 && (
                    <p className="text-gray-400">No prompts found.</p>
                )}
                <ul className="space-y-2">
                    {prompts.map(prompt => (
                        <li
                            key={prompt.id}
                            className="p-3 bg-white border rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{prompt.title}</span>
                                {prompt.isFavorite && (
                                    <span className="text-yellow-500 text-sm">★</span>
                                )}
                            </div>
                            {prompt.tagIds.length > 0 && (
                                <div className="mt-1 flex gap-1 flex-wrap">
                                    {prompt.tagIds.map(tagId => (
                                        <span key={tagId} className="text-xs bg-gray-100 px-1 rounded">
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
