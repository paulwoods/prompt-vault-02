import React, {useEffect, useState} from 'react';
import type {Prompt, PromptVersion} from '../types';
import {promptApi} from '../api/promptApi';

interface VersionHistoryProps {
    prompt: Prompt;
    onRestored: (updated: Prompt) => void;
}

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
        <div className="flex h-full" style={{background: 'var(--color-bg-base)'}}>
            {/* Version list */}
            <div
                className="w-56 shrink-0 overflow-y-auto"
                style={{borderRight: '1px solid var(--color-border)'}}
            >
                <div
                    className="px-3 py-2"
                    style={{borderBottom: '1px solid var(--color-border)'}}
                >
                    <span
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{color: 'var(--color-text-muted)'}}
                    >
                        Versions
                    </span>
                </div>
                {loading && (
                    <p className="text-xs p-3" style={{color: 'var(--color-text-muted)'}}>Loading…</p>
                )}
                {error && (
                    <p className="text-xs p-3" style={{color: 'var(--color-danger)'}}>{error}</p>
                )}
                <ul>
                    {versions.map((v, idx) => {
                        const isSelected = selectedVersion?.id === v.id;
                        return (
                            <li key={v.id}>
                                <button
                                    onClick={() => setSelectedVersion(isSelected ? null : v)}
                                    className="w-full text-left px-3 py-2.5 border-none cursor-pointer transition-colors"
                                    style={{
                                        background: isSelected ? 'var(--color-accent-dim)' : 'transparent',
                                        borderBottom: '1px solid var(--color-border-subtle)',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected)
                                            e.currentTarget.style.background = 'var(--color-bg-hover)';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected)
                                            e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div
                                        className="text-sm font-medium"
                                        style={{color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)'}}
                                    >
                                        {idx === 0 ? 'Latest' : `Version ${v.versionNumber}`}
                                    </div>
                                    <div
                                        className="text-xs mt-0.5"
                                        style={{color: 'var(--color-text-muted)'}}
                                    >
                                        {new Date(v.createdAt).toLocaleString(undefined, {
                                            month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit',
                                        })}
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>

            {/* Diff / preview pane */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!selectedVersion ? (
                    <div
                        className="flex-1 flex items-center justify-center text-sm"
                        style={{color: 'var(--color-text-muted)'}}
                    >
                        Select a version to compare
                    </div>
                ) : (
                    <>
                        {/* Pane header */}
                        <div
                            className="flex items-center justify-between px-4 py-2 shrink-0"
                            style={{
                                borderBottom: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                            }}
                        >
                            <div>
                                <span
                                    className="text-sm font-medium"
                                    style={{color: 'var(--color-text-primary)'}}
                                >
                                    Version {selectedVersion.versionNumber}
                                </span>
                                <span className="text-xs ml-2" style={{color: 'var(--color-text-muted)'}}>
                                    {new Date(selectedVersion.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRestore(selectedVersion)}
                                disabled={restoring}
                                className="text-sm px-3 py-1.5 rounded-md font-medium border-none cursor-pointer transition-colors disabled:opacity-50"
                                style={{background: 'var(--color-accent)', color: '#0f1117'}}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent)')}
                            >
                                {restoring ? 'Restoring…' : 'Restore this version'}
                            </button>
                        </div>

                        {/* Diff legend */}
                        <div
                            className="flex gap-4 px-4 py-1.5 shrink-0"
                            style={{
                                background: 'var(--color-bg-surface)',
                                borderBottom: '1px solid var(--color-border-subtle)',
                            }}
                        >
                            <span className="text-xs flex items-center gap-1"
                                  style={{color: 'var(--color-text-muted)'}}>
                                <span className="inline-block w-3 h-3 rounded-sm"
                                      style={{background: 'rgba(224,82,82,0.3)'}}/>
                                Current (removed in this version)
                            </span>
                            <span className="text-xs flex items-center gap-1"
                                  style={{color: 'var(--color-text-muted)'}}>
                                <span className="inline-block w-3 h-3 rounded-sm"
                                      style={{background: 'var(--color-accent-dim)'}}/>
                                This version (added vs current)
                            </span>
                        </div>

                        {/* Diff lines */}
                        <div className="flex-1 overflow-y-auto font-mono text-sm">
                            {diffLines?.map((line, i) => (
                                <div
                                    key={i}
                                    className="px-4 py-0.5 whitespace-pre-wrap leading-relaxed"
                                    style={{
                                        background: line.type === 'added'
                                            ? 'var(--color-accent-dim)'
                                            : line.type === 'removed'
                                                ? 'rgba(224,82,82,0.12)'
                                                : 'transparent',
                                        color: line.type === 'added'
                                            ? 'var(--color-accent)'
                                            : line.type === 'removed'
                                                ? 'var(--color-danger)'
                                                : 'var(--color-text-secondary)',
                                        textDecoration: line.type === 'removed' ? 'line-through' : 'none',
                                        opacity: line.type === 'removed' ? 0.7 : 1,
                                    }}
                                >
                                    <span
                                        className="mr-3 select-none text-xs"
                                        style={{
                                            color: line.type === 'added'
                                                ? 'var(--color-accent)'
                                                : line.type === 'removed'
                                                    ? 'var(--color-danger)'
                                                    : 'var(--color-text-muted)',
                                        }}
                                    >
                                        {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
                                    </span>
                                    {line.text || <span style={{opacity: 0.3}}>&#8203;</span>}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
