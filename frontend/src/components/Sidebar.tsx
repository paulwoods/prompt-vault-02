import React, {useState} from 'react';
import {useFolders} from '../hooks/useFolders';
import {useTags} from '../hooks/useTags';
import type {Folder} from '../types';
import {DeleteFolderModal} from './DeleteFolderModal';

interface SidebarProps {
    onFolderSelect: (folderId: string | null) => void;
    selectedFolderId: string | null;
    onTagSelect: (tagId: string | null) => void;
    selectedTagId: string | null;
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                    onFolderSelect,
                                                    selectedFolderId,
                                                    onTagSelect,
                                                    selectedTagId,
                                                    collapsed,
                                                    onToggleCollapse,
                                                }) => {
    const {folders, createFolder, renameFolder, deleteFolder} = useFolders();
    const {tags, createTag, updateTag, deleteTag} = useTags();
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState('');
    const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

    const [isCreatingTag, setIsCreatingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [editingTagId, setEditingTagId] = useState<string | null>(null);
    const [editTagName, setEditTagName] = useState('');

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            await createFolder({name: newFolderName});
            setNewFolderName('');
            setIsCreatingFolder(false);
        }
    };

    const handleRenameFolder = async (id: string) => {
        if (editFolderName.trim()) {
            await renameFolder(id, {name: editFolderName});
            setEditingFolderId(null);
        }
    };

    const handleCreateTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTagName.trim()) {
            await createTag({name: newTagName});
            setNewTagName('');
            setIsCreatingTag(false);
        }
    };

    const handleUpdateTag = async (id: string) => {
        if (editTagName.trim()) {
            await updateTag(id, {name: editTagName});
            setEditingTagId(null);
        }
    };

    const handleDeleteFolder = async (id: string, mode: any, targetFolderId?: string) => {
        await deleteFolder(id, mode, targetFolderId);
        if (selectedFolderId === id) onFolderSelect(null);
        setFolderToDelete(null);
    };

    const handleDeleteTag = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this tag?')) {
            await deleteTag(id);
            if (selectedTagId === id) onTagSelect(null);
        }
    };

    return (
        <div
            style={{
                width: collapsed ? '48px' : '240px',
                transition: 'width 200ms ease',
                background: 'var(--color-bg-surface)',
                borderRight: '1px solid var(--color-border)',
                flexShrink: 0,
            }}
            className="h-full flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 shrink-0"
                style={{height: '48px', borderBottom: '1px solid var(--color-border-subtle)'}}
            >
                {!collapsed && (
                    <span
                        className="font-bold text-sm tracking-wide truncate"
                        style={{color: 'var(--color-accent)'}}
                    >
                        Prompt Vault
                    </span>
                )}
                <button
                    onClick={onToggleCollapse}
                    title={collapsed ? 'Expand sidebar (⌘\\)' : 'Collapse sidebar (⌘\\)'}
                    className="p-1.5 rounded transition-colors border-none cursor-pointer ml-auto shrink-0"
                    style={{
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {collapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                        )}
                    </svg>
                </button>
            </div>

            {/* Content — hidden when collapsed */}
            {!collapsed && (
                <div className="flex-1 overflow-y-auto p-3 space-y-6">
                    {/* Folders */}
                    <div>
                        <h3
                            className="text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{color: 'var(--color-text-muted)'}}
                        >
                            Folders
                        </h3>
                        <ul className="space-y-0.5">
                            <li>
                                <button
                                    onClick={() => onFolderSelect(null)}
                                    className="w-full text-left px-2 py-1.5 rounded text-sm transition-colors border-none cursor-pointer"
                                    style={{
                                        background: selectedFolderId === null
                                            ? 'var(--color-accent-dim)'
                                            : 'transparent',
                                        color: selectedFolderId === null
                                            ? 'var(--color-accent)'
                                            : 'var(--color-text-secondary)',
                                        fontWeight: selectedFolderId === null ? 600 : 400,
                                    }}
                                    onMouseEnter={e => {
                                        if (selectedFolderId !== null)
                                            e.currentTarget.style.background = 'var(--color-bg-hover)';
                                    }}
                                    onMouseLeave={e => {
                                        if (selectedFolderId !== null)
                                            e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    All Prompts
                                </button>
                            </li>
                            {folders.map(folder => (
                                <li key={folder.id} className="group flex items-center justify-between">
                                    {editingFolderId === folder.id ? (
                                        <input
                                            autoFocus
                                            className="px-2 py-1 w-full rounded text-sm"
                                            style={{
                                                background: 'var(--color-bg-elevated)',
                                                color: 'var(--color-text-primary)',
                                                border: '1px solid var(--color-accent)',
                                                outline: 'none',
                                            }}
                                            value={editFolderName}
                                            onChange={e => setEditFolderName(e.target.value)}
                                            onBlur={() => handleRenameFolder(folder.id)}
                                            onKeyDown={e => e.key === 'Enter' && handleRenameFolder(folder.id)}
                                        />
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onFolderSelect(folder.id);
                                                    onTagSelect(null);
                                                }}
                                                className="flex-grow text-left px-2 py-1.5 rounded text-sm transition-colors border-none cursor-pointer"
                                                style={{
                                                    background: selectedFolderId === folder.id
                                                        ? 'var(--color-accent-dim)'
                                                        : 'transparent',
                                                    color: selectedFolderId === folder.id
                                                        ? 'var(--color-accent)'
                                                        : 'var(--color-text-secondary)',
                                                    fontWeight: selectedFolderId === folder.id ? 600 : 400,
                                                }}
                                                onMouseEnter={e => {
                                                    if (selectedFolderId !== folder.id)
                                                        e.currentTarget.style.background = 'var(--color-bg-hover)';
                                                }}
                                                onMouseLeave={e => {
                                                    if (selectedFolderId !== folder.id)
                                                        e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                {folder.name}
                                            </button>
                                            <div className="hidden group-hover:flex space-x-1 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        setEditingFolderId(folder.id);
                                                        setEditFolderName(folder.name);
                                                    }}
                                                    className="text-xs px-1 py-0.5 rounded border-none cursor-pointer"
                                                    style={{color: 'var(--color-accent)', background: 'transparent'}}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setFolderToDelete(folder)}
                                                    className="text-xs px-1 py-0.5 rounded border-none cursor-pointer"
                                                    style={{color: 'var(--color-danger)', background: 'transparent'}}
                                                >
                                                    Del
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {isCreatingFolder ? (
                            <form onSubmit={handleCreateFolder} className="mt-2">
                                <input
                                    autoFocus
                                    className="w-full px-2 py-1.5 rounded text-sm"
                                    style={{
                                        background: 'var(--color-bg-elevated)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-accent)',
                                        outline: 'none',
                                    }}
                                    placeholder="Folder name..."
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    onBlur={() => setIsCreatingFolder(false)}
                                />
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="mt-2 text-xs border-none cursor-pointer bg-transparent transition-colors"
                                style={{color: 'var(--color-accent)'}}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                            >
                                + New Folder
                            </button>
                        )}
                    </div>

                    {/* Tags */}
                    <div>
                        <h3
                            className="text-xs font-semibold uppercase tracking-wider mb-2"
                            style={{color: 'var(--color-text-muted)'}}
                        >
                            Tags
                        </h3>
                        <ul className="space-y-0.5">
                            {tags.map(tag => (
                                <li key={tag.id} className="group flex items-center justify-between">
                                    {editingTagId === tag.id ? (
                                        <input
                                            autoFocus
                                            className="px-2 py-1 w-full rounded text-sm"
                                            style={{
                                                background: 'var(--color-bg-elevated)',
                                                color: 'var(--color-text-primary)',
                                                border: '1px solid var(--color-accent)',
                                                outline: 'none',
                                            }}
                                            value={editTagName}
                                            onChange={e => setEditTagName(e.target.value)}
                                            onBlur={() => handleUpdateTag(tag.id)}
                                            onKeyDown={e => e.key === 'Enter' && handleUpdateTag(tag.id)}
                                        />
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    onTagSelect(tag.id);
                                                    onFolderSelect(null);
                                                }}
                                                className="flex-grow text-left px-2 py-1.5 rounded text-sm transition-colors border-none cursor-pointer"
                                                style={{
                                                    background: selectedTagId === tag.id
                                                        ? 'var(--color-accent-dim)'
                                                        : 'transparent',
                                                    color: selectedTagId === tag.id
                                                        ? 'var(--color-accent)'
                                                        : 'var(--color-text-secondary)',
                                                    fontWeight: selectedTagId === tag.id ? 600 : 400,
                                                }}
                                                onMouseEnter={e => {
                                                    if (selectedTagId !== tag.id)
                                                        e.currentTarget.style.background = 'var(--color-bg-hover)';
                                                }}
                                                onMouseLeave={e => {
                                                    if (selectedTagId !== tag.id)
                                                        e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                #{tag.name}
                                            </button>
                                            <div className="hidden group-hover:flex space-x-1 shrink-0">
                                                <button
                                                    onClick={() => {
                                                        setEditingTagId(tag.id);
                                                        setEditTagName(tag.name);
                                                    }}
                                                    className="text-xs px-1 py-0.5 rounded border-none cursor-pointer"
                                                    style={{color: 'var(--color-accent)', background: 'transparent'}}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTag(tag.id)}
                                                    className="text-xs px-1 py-0.5 rounded border-none cursor-pointer"
                                                    style={{color: 'var(--color-danger)', background: 'transparent'}}
                                                >
                                                    Del
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {isCreatingTag ? (
                            <form onSubmit={handleCreateTag} className="mt-2">
                                <input
                                    autoFocus
                                    className="w-full px-2 py-1.5 rounded text-sm"
                                    style={{
                                        background: 'var(--color-bg-elevated)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid var(--color-accent)',
                                        outline: 'none',
                                    }}
                                    placeholder="Tag name..."
                                    value={newTagName}
                                    onChange={e => setNewTagName(e.target.value)}
                                    onBlur={() => setIsCreatingTag(false)}
                                />
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreatingTag(true)}
                                className="mt-2 text-xs border-none cursor-pointer bg-transparent transition-colors"
                                style={{color: 'var(--color-accent)'}}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-accent-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-accent)')}
                            >
                                + New Tag
                            </button>
                        )}
                    </div>
                </div>
            )}

            {folderToDelete && (
                <DeleteFolderModal
                    folder={folderToDelete}
                    otherFolders={folders.filter(f => f.id !== folderToDelete.id)}
                    onClose={() => setFolderToDelete(null)}
                    onConfirm={(mode, targetId) => handleDeleteFolder(folderToDelete.id, mode, targetId)}
                />
            )}
        </div>
    );
};
