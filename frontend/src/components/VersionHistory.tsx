import React, {useEffect, useState} from 'react';
import type {Prompt, PromptVersion} from '../types';
import {promptApi} from '../api/promptApi';

interface VersionHistoryProps {
    prompt: Prompt;
    onRestored: (updated: Prompt) => void;
}

// Simple line-level diff: returns tokens tagged as added, removed, or unchanged
function computeDiff(oldText: string, newText: string): { text: string; type: 'added' | 'removed' | 'unchanged' }[] {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const result: { text: string; type: 'added' | 'removed' | 'unchanged' }[] = [];

    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
        const o = oldLines[i];
        const n = newLines[i];
        if (o === undefined) {
            result.push({text: n, type: 'added'});
        } else if (n === undefined) {
            result.push({text: o, type: 'removed'});
        } else if (o === n) {
            result.push({text: o, type: 'unchanged'});
        } else {
            result.push({text: o, type: 'removed'});
            result.push({text: n, type: 'added'});
        }
    }
    return result;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, '');
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({prompt, onRestored}) => {
    const [versions, setVersions] = useState<PromptVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        promptApi.getVersions(prompt.id)
            .then(v => {
                // Show newest first
                setVersions([...v].reverse());
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load version history');
                setLoading(false);
            });
    }, [prompt.id]);

    const handleRestore = async (version: PromptVersion) => {
        setRestoring(true);
        try {
            const updated = await promptApi.restoreVersion(prompt.id, version.id);
            onRestored(updated);
        } catch {
            setError('Failed to restore version');
        } finally {
            setRestoring(false);
        }
    };

    const currentText = stripHtml(prompt.currentBody);
    const selectedText = selectedVersion ? stripHtml(selectedVersion.bodySnapshot) : null;
    const diffLines = selectedText !== null ? computeDiff(currentText, selectedText) : null;

    return (
        <div className="flex h-full">
            {/* Version list */}
            <div className="w-56 shrink-0 border-r border-gray-200 overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-200">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Versions</span>
                </div>
                {loading && <p className="text-xs text-gray-400 p-3">Loading…</p>}
                {error && <p className="text-xs text-red-500 p-3">{error}</p>}
                <ul>
                    {versions.map((v, idx) => (
                        <li key={v.id}>
                            <button
                                onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors border-none cursor-pointer
                                    ${selectedVersion?.id === v.id ? 'bg-gray-900 text-white' : 'bg-transparent hover:bg-gray-50 text-gray-700'}`}
                            >
                                <div className="text-sm font-medium">
                                    {idx === 0 ? 'Latest' : `Version ${v.versionNumber}`}
                                </div>
                                <div
                                    className={`text-xs mt-0.5 ${selectedVersion?.id === v.id ? 'text-gray-300' : 'text-gray-400'}`}>
                                    {new Date(v.createdAt).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Diff / preview pane */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedVersion ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                        Select a version to compare
                    </div>
                ) : (
                    <>
                        {/* Pane header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0">
                            <div>
                                <span className="text-sm font-medium text-gray-900">
                                    Version {selectedVersion.versionNumber}
                                </span>
                                <span className="text-xs text-gray-400 ml-2">
                                    {new Date(selectedVersion.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRestore(selectedVersion)}
                                disabled={restoring}
                                className="text-sm bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-md font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50 border-none cursor-pointer"
                            >
                                {restoring ? 'Restoring…' : 'Restore this version'}
                            </button>
                        </div>

                        {/* Diff legend */}
                        <div className="flex gap-4 px-4 py-1.5 bg-gray-50 border-b border-gray-200 shrink-0">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-sm bg-red-200"/>
                                Current (removed in this version)
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="inline-block w-3 h-3 rounded-sm bg-yellow-200"/>
                                This version (added vs current)
                            </span>
                        </div>

                        {/* Diff lines */}
                        <div className="flex-1 overflow-y-auto font-mono text-sm">
                            {diffLines?.map((line, i) => (
                                <div
                                    key={i}
                                    className={`px-4 py-0.5 whitespace-pre-wrap leading-relaxed
                                        ${line.type === 'added' ? 'bg-yellow-50 text-yellow-900' : ''}
                                        ${line.type === 'removed' ? 'bg-red-50 text-red-900 line-through opacity-60' : ''}
                                        ${line.type === 'unchanged' ? 'text-gray-700' : ''}`}
                                >
                                    <span className={`mr-3 select-none text-xs
                                        ${line.type === 'added' ? 'text-yellow-500' : ''}
                                        ${line.type === 'removed' ? 'text-red-400' : ''}
                                        ${line.type === 'unchanged' ? 'text-gray-300' : ''}`}>
                                        {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
                                    </span>
                                    {line.text || <span className="opacity-30">&#8203;</span>}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
