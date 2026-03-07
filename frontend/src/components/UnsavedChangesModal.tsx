import React from 'react';

interface UnsavedChangesModalProps {
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({onSave, onDiscard, onCancel}) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div
            className="rounded-xl p-6 w-full max-w-sm shadow-2xl"
            style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
            }}
        >
            <h3 className="text-base font-semibold mb-1" style={{color: 'var(--color-text-primary)'}}>
                Unsaved changes
            </h3>
            <p className="text-sm mb-6" style={{color: 'var(--color-text-secondary)'}}>
                You have unsaved changes. What would you like to do?
            </p>
            <div className="flex flex-col gap-2">
                <button
                    onClick={onSave}
                    className="w-full py-2 rounded-md text-sm font-medium border-none cursor-pointer transition-colors"
                    style={{background: 'var(--color-accent)', color: '#0f1117'}}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                >
                    Save changes
                </button>
                <button
                    onClick={onDiscard}
                    className="w-full py-2 rounded-md text-sm font-medium cursor-pointer transition-colors"
                    style={{
                        background: 'transparent',
                        color: 'var(--color-danger)',
                        border: '1px solid var(--color-danger)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(224,82,82,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    Discard changes
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-2 rounded-md text-sm font-medium cursor-pointer transition-colors"
                    style={{
                        background: 'transparent',
                        color: 'var(--color-text-secondary)',
                        border: '1px solid var(--color-border)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                    Keep editing
                </button>
            </div>
        </div>
    </div>
);
