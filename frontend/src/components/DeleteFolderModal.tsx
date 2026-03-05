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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Delete Folder: {folder.name}</h3>
                <p className="mb-4 text-gray-600">What should we do with the prompts inside this folder?</p>

                <div className="space-y-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="radio"
                            name="deleteMode"
                            checked={mode === 'move'}
                            onChange={() => setMode('move')}
                        />
                        <span>Move prompts to...</span>
                    </label>

                    {mode === 'move' && (
                        <select
                            className="ml-6 w-full p-2 border rounded"
                            value={targetId}
                            onChange={(e) => setTargetId(e.target.value)}
                        >
                            <option value="root">Root (No folder)</option>
                            {otherFolders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    )}

                    <label className="flex items-center space-x-2 text-red-600">
                        <input
                            type="radio"
                            name="deleteMode"
                            checked={mode === 'delete'}
                            onChange={() => setMode('delete')}
                        />
                        <span>Delete all prompts (Permanent)</span>
                    </label>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(mode, targetId === 'root' ? undefined : targetId)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Delete Folder
                    </button>
                </div>
            </div>
        </div>
    );
};
