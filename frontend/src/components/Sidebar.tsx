import React, {useState} from 'react';
import {useFolders} from '../hooks/useFolders';
import {Folder} from '../types';
import {DeleteFolderModal} from './DeleteFolderModal';

interface SidebarProps {
    onFolderSelect: (folderId: string | null) => void;
    selectedFolderId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({onFolderSelect, selectedFolderId}) => {
    const {folders, loading, createFolder, renameFolder, deleteFolder} = useFolders();
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newFolderName.trim()) {
            await createFolder({name: newFolderName});
            setNewFolderName('');
            setIsCreating(false);
        }
    };

    const handleRename = async (id: string) => {
        if (editName.trim()) {
            await renameFolder(id, {name: editName});
            setEditingFolderId(null);
        }
    };

    const handleDelete = async (id: string, mode: any, targetFolderId?: string) => {
        await deleteFolder(id, mode, targetFolderId);
        if (selectedFolderId === id) onFolderSelect(null);
        setFolderToDelete(null);
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
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onBlur={() => handleRename(folder.id)}
                                    onKeyDown={e => e.key === 'Enter' && handleRename(folder.id)}
                                />
                            ) : (
                                <>
                                    <button
                                        onClick={() => onFolderSelect(folder.id)}
                                        className={`flex-grow text-left px-2 py-1 rounded ${selectedFolderId === folder.id ? 'bg-blue-200' : 'hover:bg-gray-200'}`}
                                    >
                                        {folder.name}
                                    </button>
                                    <div className="hidden group-hover:flex space-x-1">
                                        <button
                                            onClick={() => {
                                                setEditingFolderId(folder.id);
                                                setEditName(folder.name);
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

                {isCreating ? (
                    <form onSubmit={handleCreate} className="mt-2">
                        <input
                            autoFocus
                            className="w-full px-2 py-1 border rounded"
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onBlur={() => setIsCreating(false)}
                        />
                    </form>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        + New Folder
                    </button>
                )}
            </div>

            {folderToDelete && (
                <DeleteFolderModal
                    folder={folderToDelete}
                    otherFolders={folders.filter(f => f.id !== folderToDelete.id)}
                    onClose={() => setFolderToDelete(null)}
                    onConfirm={(mode, targetId) => handleDelete(folderToDelete.id, mode, targetId)}
                />
            )}
        </div>
    );
};
