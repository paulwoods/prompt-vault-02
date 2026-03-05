import React, {useCallback, useEffect, useRef, useState} from 'react';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ReactMarkdown from 'react-markdown';
import type {Prompt, PromptRequest} from '../types';
import {promptApi} from '../api/promptApi';
import {UnsavedChangesModal} from './UnsavedChangesModal';
import {VersionHistory} from './VersionHistory';

interface PromptEditorProps {
    prompt: Prompt;
    onSaved: (updated: Prompt) => void;
    onClose: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({prompt, onSaved, onClose}) => {
    const [mode, setMode] = useState<'edit' | 'view' | 'history'>('edit');
    const [title, setTitle] = useState(prompt.title);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showUnsaved, setShowUnsaved] = useState(false);
    const promptRef = useRef(prompt);

    // Track the "clean" body and title so we can detect changes
    const savedBodyRef = useRef(prompt.currentBody);
    const savedTitleRef = useRef(prompt.title);
    const rowVersionRef = useRef(prompt.rowVersion);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({placeholder: 'Write your prompt here...'}),
        ],
        content: prompt.currentBody,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
            },
        },
    });

    // Keep promptRef current for the keyboard handler
    useEffect(() => {
        promptRef.current = prompt;
    }, [prompt]);

    const isDirty = useCallback(() => {
        const currentBody = editor?.getText() !== undefined ? editor.getHTML() : savedBodyRef.current;
        return title !== savedTitleRef.current || currentBody !== savedBodyRef.current;
    }, [editor, title]);

    const save = useCallback(async () => {
        if (!editor) return;
        setSaving(true);
        setSaveError(null);
        try {
            const body = editor.getHTML();
            const request: PromptRequest = {
                title,
                currentBody: body,
                isFavorite: promptRef.current.isFavorite || false,
                folderId: promptRef.current.folderId,
                tagIds: promptRef.current.tagIds,
                comments: promptRef.current.comments,
            };
            const updated = await promptApi.update(promptRef.current.id, request, rowVersionRef.current);
            savedBodyRef.current = body;
            savedTitleRef.current = title;
            rowVersionRef.current = updated.rowVersion;
            onSaved(updated);
        } catch (e: unknown) {
            setSaveError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    }, [editor, title, onSaved]);

    // Cmd/Ctrl+S
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                save();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [save]);

    const handleClose = () => {
        if (isDirty()) {
            setShowUnsaved(true);
        } else {
            onClose();
        }
    };

    const handleSaveAndClose = async () => {
        await save();
        setShowUnsaved(false);
        onClose();
    };

    const currentBody = editor?.getHTML() ?? prompt.currentBody;

    return (
        <div className="flex flex-col h-full bg-white">

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0">
                <button
                    onClick={handleClose}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 bg-transparent border-none cursor-pointer px-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                    </svg>
                    Back
                </button>

                <div className="flex items-center gap-2">
                    {/* Edit / Preview / History toggle */}
                    <div className="flex border border-gray-200 rounded-md p-0.5 text-sm">
                        {(['edit', 'view', 'history'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors border-none cursor-pointer capitalize
                                    ${mode === m ? 'bg-gray-900 text-white' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                {m === 'view' ? 'Preview' : m === 'history' ? 'History' : 'Edit'}
                            </button>
                        ))}
                    </div>

                    {saveError && (
                        <span className="text-xs text-red-600">{saveError}</span>
                    )}

                    <button
                        onClick={save}
                        disabled={saving}
                        className="bg-gray-900 text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 border-none cursor-pointer font-medium"
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Title — hidden in history mode */}
            {mode !== 'history' && (
                <div className="px-6 pt-5 pb-2 shrink-0 border-b border-gray-100">
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Untitled prompt"
                        className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
                    />
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-hidden">
                {mode === 'edit' && (
                    <div className="h-full overflow-y-auto">
                        <EditorContent editor={editor} className="h-full"/>
                    </div>
                )}
                {mode === 'view' && (
                    <div className="h-full overflow-y-auto px-6 py-4 prose prose-sm max-w-none">
                        <ReactMarkdown>{currentBody.replace(/<[^>]+>/g, '')}</ReactMarkdown>
                    </div>
                )}
                {mode === 'history' && (
                    <VersionHistory
                        prompt={prompt}
                        onRestored={restored => {
                            onSaved(restored);
                            setMode('edit');
                            savedBodyRef.current = restored.currentBody;
                            savedTitleRef.current = restored.title;
                            rowVersionRef.current = restored.rowVersion;
                            editor?.commands.setContent(restored.currentBody);
                            setTitle(restored.title);
                        }}
                    />
                )}
            </div>

            {/* Status bar — only in edit/view modes */}
            {mode !== 'history' && (
                <div className="shrink-0 px-6 py-1.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                        {isDirty() ? '● Unsaved changes' : 'All changes saved'}
                    </span>
                    <span className="text-xs text-gray-400">
                        {navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S'} to save
                    </span>
                </div>
            )}

            {showUnsaved && (
                <UnsavedChangesModal
                    onSave={handleSaveAndClose}
                    onDiscard={() => {
                        setShowUnsaved(false);
                        onClose();
                    }}
                    onCancel={() => setShowUnsaved(false)}
                />
            )}
        </div>
    );
};
