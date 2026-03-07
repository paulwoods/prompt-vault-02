import React from 'react';
import type {DeleteFolderMode, Folder} from '../types';

interface DeleteFolderModalProps {
    folder: Folder;
    onClose: () => void;
    onConfirm: (mode: DeleteFolderMode, targetFolderId?: string) => void;
    otherFolders: Folder[];
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({folder, onClose, onConfirm, otherFolders}) => {
    const [mode, setMode] = React.useState<DeleteFolderMode>('move');
    const [targetId, setTargetId] = React.useState<string>('root');

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div
                className="rounded-xl p-6 max-w-md w-full shadow-2xl"
                style={{
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                }}
            >
                <h3 className="text-lg font-bold mb-4" style={{color: 'var(--color-text-primary)'}}>
                    Delete Folder: {folder.name}
                </h3>
                <p className="mb-4 text-sm" style={{color: 'var(--color-text-secondary)'}}>
                    What should we do with the prompts inside this folder?
                </p>

                <div className="space-y-4">
                    <label className="flex items-center space-x-2 cursor-pointer"
                           style={{color: 'var(--color-text-primary)'}}>
                        <input
                            type="radio"
                            name="deleteMode"
                            checked={mode === 'move'}
                            onChange={() => setMode('move')}
                            style={{accentColor: 'var(--color-accent)'}}
                        />
                        <span className="text-sm">Move prompts to...</span>
                    </label>

                    {mode === 'move' && (
                        <select
                            className="ml-6 w-full p-2 rounded text-sm"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                color: 'var(--color-text-primary)',
                                border: '1px solid var(--color-border)',
                            }}
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                        >
                            <option value="root">Root (No folder)</option>
                            {otherFolders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    )}

                    <label className="flex items-center space-x-2 cursor-pointer"
                           style={{color: 'var(--color-danger)'}}>
                        <input
                            type="radio"
                            name="deleteMode"
                            checked={mode === 'delete'}
                            onChange={() => setMode('delete')}
                            style={{accentColor: 'var(--color-danger)'}}
                        />
                        <span className="text-sm">Delete all prompts (Permanent)</span>
                    </label>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-sm cursor-pointer border-none transition-colors"
                        style={{background: 'transparent', color: 'var(--color-text-secondary)'}}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(mode, targetId === 'root' ? undefined : targetId)}
                        className="px-4 py-2 rounded text-sm cursor-pointer border-none transition-colors"
                        style={{background: 'var(--color-danger)', color: '#fff'}}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-danger-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-danger)')}
                    >
                        Delete Folder
                    </button>
                </div>
            </div>
        </div>
    );
};
