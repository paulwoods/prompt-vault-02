import React, {useEffect, useRef, useState} from 'react';
import type {Folder, Tag} from '../types';
import {folderApi} from '../api/folderApi';
import {tagApi} from '../api/tagApi';

interface PromptMetaBarProps {
    folderId?: string;
    tagIds: string[];
    onFolderChange: (folderId: string | undefined) => void;
    onTagsChange: (tagIds: string[]) => void;
}

export const PromptMetaBar: React.FC<PromptMetaBarProps> = ({
                                                                folderId,
                                                                tagIds,
                                                                onFolderChange,
                                                                onTagsChange,
                                                            }) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
    const tagDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        folderApi.getAll().then(setFolders).catch(() => {
        });
        tagApi.getAll().then(setTags).catch(() => {
        });
    }, []);

    // Close tag dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
                setTagDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectedTags = tags.filter(t => tagIds.includes(t.id));

    const toggleTag = (tagId: string) => {
        if (tagIds.includes(tagId)) {
            onTagsChange(tagIds.filter(id => id !== tagId));
        } else {
            onTagsChange([...tagIds, tagId]);
        }
    };

    return (
        <div className="flex items-center gap-4 px-6 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
            {/* Folder picker */}
            <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor"
                     viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                </svg>
                <select
                    value={folderId ?? ''}
                    onChange={e => onFolderChange(e.target.value || undefined)}
                    className="text-xs text-gray-600 bg-transparent border-none outline-none cursor-pointer pr-4 appearance-none"
                >
                    <option value="">No folder</option>
                    {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
            </div>

            <span className="text-gray-200 text-xs">|</span>

            {/* Tag picker */}
            <div className="relative flex items-center gap-1.5" ref={tagDropdownRef}>
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor"
                     viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 9V4a1 1 0 011-1h3z"/>
                </svg>
                <button
                    onClick={() => setTagDropdownOpen(o => !o)}
                    className="text-xs text-gray-600 bg-transparent border-none outline-none cursor-pointer hover:text-gray-900 flex items-center gap-1"
                >
                    {selectedTags.length === 0
                        ? 'Add tags'
                        : selectedTags.map(t => t.name).join(', ')}
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>

                {tagDropdownOpen && (
                    <div
                        className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[160px] py-1">
                        {tags.length === 0 ? (
                            <p className="text-xs text-gray-400 px-3 py-2">No tags available</p>
                        ) : (
                            tags.map(tag => (
                                <label
                                    key={tag.id}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={tagIds.includes(tag.id)}
                                        onChange={() => toggleTag(tag.id)}
                                        className="accent-gray-900"
                                    />
                                    <span className="text-xs text-gray-700">{tag.name}</span>
                                </label>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
