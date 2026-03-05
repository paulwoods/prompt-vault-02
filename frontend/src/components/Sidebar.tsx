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
}

export const Sidebar: React.FC<SidebarProps> = ({onFolderSelect, selectedFolderId, onTagSelect, selectedTagId}) => {
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
        <div className="w-64 h-full bg-gray-100 border-r p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4">Prompt Vault</h2>

            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Folders</h3>
                <ul className="space-y-1">
                    <li>
                        <button
                            onClick={() => onFolderSelect(null)}
                            className={`w-full text-left px-2 py-1 rounded ${selectedFolderId === null ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                        >
                            All Prompts
                        </button>
                    </li>
                    {folders.map(folder => (
                        <li key={folder.id} className="group flex items-center justify-between">
                            {editingFolderId === folder.id ? (
                                <input
                                    autoFocus
                                    className="px-2 py-1 w-full border rounded"
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
                                        className={`flex-grow text-left px-2 py-1 rounded ${selectedFolderId === folder.id ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                                    >
                                        {folder.name}
                                    </button>
                                    <div className="hidden group-hover:flex space-x-1">
                                        <button
                                            onClick={() => {
                                                setEditingFolderId(folder.id);
                                                setEditFolderName(folder.name);
                                            }}
                                            className="text-xs text-blue-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setFolderToDelete(folder)}
                                            className="text-xs text-red-600"
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
                            className="w-full px-2 py-1 border rounded"
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onBlur={() => setIsCreatingFolder(false)}
                        />
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreatingFolder(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        + New Folder
                    </button>
                )}
            </div>

            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
                <ul className="space-y-1">
                    {tags.map(tag => (
                        <li key={tag.id} className="group flex items-center justify-between">
                            {editingTagId === tag.id ? (
                                <input
                                    autoFocus
                                    className="px-2 py-1 w-full border rounded"
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
                                        className={`flex-grow text-left px-2 py-1 rounded ${selectedTagId === tag.id ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                                    >
                                        #{tag.name}
                                    </button>
                                    <div className="hidden group-hover:flex space-x-1">
                                        <button
                                            onClick={() => {
                                                setEditingTagId(tag.id);
                                                setEditTagName(tag.name);
                                            }}
                                            className="text-xs text-blue-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTag(tag.id)}
                                            className="text-xs text-red-600"
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
                            className="w-full px-2 py-1 border rounded"
                            placeholder="Tag name..."
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            onBlur={() => setIsCreatingTag(false)}
                        />
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreatingTag(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        + New Tag
                    </button>
                )}
            </div>

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
