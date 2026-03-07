import React, {useCallback, useEffect, useRef, useState} from 'react';
import {EditorContent, useEditor} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ReactMarkdown from 'react-markdown';
import type {Prompt, PromptRequest} from '../types';
import {promptApi} from '../api/promptApi';
import {UnsavedChangesModal} from './UnsavedChangesModal';
import {VersionHistory} from './VersionHistory';
import {SharePanel} from './SharePanel';
import {PromptMetaBar} from './PromptMetaBar';

interface PromptEditorProps {
    prompt: Prompt;
    onSaved: (updated: Prompt) => void;
    onClose: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({prompt, onSaved, onClose}) => {
    const [mode, setMode] = useState<'edit' | 'view' | 'history' | 'share'>('edit');
    const [title, setTitle] = useState(prompt.title);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showUnsaved, setShowUnsaved] = useState(false);
    const promptRef = useRef(prompt);

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
                class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] p-6',
            },
        },
    });

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
            promptRef.current = updated;
            onSaved(updated);
        } catch (e: unknown) {
            setSaveError(e instanceof Error ? e.message : 'Save failed');
        } finally {
            setSaving(false);
        }
    }, [editor, title, onSaved]);

    const saveMetaOnly = useCallback(async (folderId: string | undefined, tagIds: string[]) => {
        if (!editor) return;
        setSaveError(null);
        try {
            const body = editor.getHTML();
            const request: PromptRequest = {
                title: promptRef.current.title,
                currentBody: body,
                isFavorite: promptRef.current.isFavorite || false,
                folderId,
                tagIds,
                comments: promptRef.current.comments,
            };
            const updated = await promptApi.update(promptRef.current.id, request, rowVersionRef.current);
            rowVersionRef.current = updated.rowVersion;
            promptRef.current = updated;
            onSaved(updated);
        } catch (e: unknown) {
            setSaveError(e instanceof Error ? e.message : 'Save failed');
        }
    }, [editor, onSaved]);

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

    const tabBtn = (m: typeof mode, label: string) => (
        <button
            key={m}
            onClick={() => setMode(m)}
            className="px-3 py-1 rounded text-sm font-medium transition-colors border-none cursor-pointer"
            style={{
                background: mode === m ? 'var(--color-accent)' : 'transparent',
                color: mode === m ? '#0f1117' : 'var(--color-text-secondary)',
            }}
            onMouseEnter={e => {
                if (mode !== m) e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={e => {
                if (mode !== m) e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full" style={{background: 'var(--color-bg-base)'}}>

            {/* Toolbar */}
            <div
                className="flex items-center justify-between px-4 py-2 shrink-0"
                style={{
                    background: 'var(--color-bg-surface)',
                    borderBottom: '1px solid var(--color-border)',
                }}
            >
                <button
                    onClick={handleClose}
                    className="flex items-center gap-1 text-sm bg-transparent border-none cursor-pointer px-0 transition-colors"
                    style={{color: 'var(--color-text-secondary)'}}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                    </svg>
                    Back
                </button>

                <div className="flex items-center gap-2">
                    <div
                        className="flex p-0.5 rounded-md"
                        style={{background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)'}}
                    >
                        {tabBtn('edit', 'Edit')}
                        {tabBtn('view', 'Preview')}
                        {tabBtn('history', 'History')}
                        {tabBtn('share', 'Share')}
                    </div>

                    {saveError && (
                        <span className="text-xs" style={{color: 'var(--color-danger)'}}>{saveError}</span>
                    )}

                    <button
                        onClick={save}
                        disabled={saving}
                        className="text-sm px-4 py-1.5 rounded-md font-medium border-none cursor-pointer transition-colors disabled:opacity-50"
                        style={{background: 'var(--color-accent)', color: '#0f1117'}}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                    >
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>

            {/* PV-111: Permanent attribution banner for forked prompts */}
            {prompt.forkedFromPromptId && (
                <div
                    className="shrink-0 px-6 py-2 flex items-center gap-2"
                    style={{
                        background: 'var(--color-accent-dim)',
                        borderBottom: '1px solid rgba(245,200,66,0.25)',
                    }}
                >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                         style={{color: 'var(--color-accent)'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    <span className="text-xs" style={{color: 'var(--color-accent)'}}>
                        Forked from a prompt by <strong>{prompt.forkedFromAuthor}</strong>
                    </span>
                </div>
            )}

            {/* Title + meta */}
            {mode !== 'history' && mode !== 'share' && (
                <>
                    <div
                        className="px-6 pt-5 pb-2 shrink-0"
                        style={{borderBottom: '1px solid var(--color-border-subtle)'}}
                    >
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Untitled prompt"
                            className="w-full text-2xl font-bold bg-transparent border-none outline-none"
                            style={{color: 'var(--color-text-primary)'}}
                        />
                    </div>
                    <PromptMetaBar
                        folderId={promptRef.current.folderId}
                        tagIds={promptRef.current.tagIds}
                        onFolderChange={folderId => saveMetaOnly(folderId, promptRef.current.tagIds)}
                        onTagsChange={tagIds => saveMetaOnly(promptRef.current.folderId, tagIds)}
                    />
                </>
            )}

            {/* Body */}
            <div className="flex-1 overflow-hidden">
                {mode === 'edit' && (
                    <div className="h-full overflow-y-auto" style={{color: 'var(--color-text-primary)'}}>
                        <EditorContent editor={editor} className="h-full"/>
                    </div>
                )}
                {mode === 'view' && (
                    <div
                        className="h-full overflow-y-auto px-6 py-4 prose prose-invert prose-sm max-w-none"
                        style={{color: 'var(--color-text-primary)'}}
                    >
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
                            promptRef.current = restored;
                            editor?.commands.setContent(restored.currentBody);
                            setTitle(restored.title);
                        }}
                    />
                )}
                {mode === 'share' && (
                    <SharePanel promptId={prompt.id}/>
                )}
            </div>

            {/* Status bar */}
            {mode !== 'history' && mode !== 'share' && (
                <div
                    className="shrink-0 px-6 py-1.5 flex items-center justify-between"
                    style={{
                        background: 'var(--color-bg-surface)',
                        borderTop: '1px solid var(--color-border-subtle)',
                    }}
                >
                    <span className="text-xs" style={{color: 'var(--color-text-muted)'}}>
                        {isDirty() ? '● Unsaved changes' : 'All changes saved'}
                    </span>
                    <span className="text-xs" style={{color: 'var(--color-text-muted)'}}>
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
