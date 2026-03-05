import React from 'react';

interface UnsavedChangesModalProps {
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({onSave, onDiscard, onCancel}) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Unsaved changes</h3>
            <p className="text-sm text-gray-500 mb-6">You have unsaved changes. What would you like to do?</p>
            <div className="flex flex-col gap-2">
                <button
                    onClick={onSave}
                    className="w-full bg-gray-900 text-white py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors border-none cursor-pointer"
                >
                    Save changes
                </button>
                <button
                    onClick={onDiscard}
                    className="w-full bg-transparent text-red-600 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors border border-red-200 cursor-pointer"
                >
                    Discard changes
                </button>
                <button
                    onClick={onCancel}
                    className="w-full bg-transparent text-gray-500 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200 cursor-pointer"
                >
                    Keep editing
                </button>
            </div>
        </div>
    </div>
);
