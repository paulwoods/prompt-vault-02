import {useCallback, useEffect, useRef, useState} from 'react';
import {promptApi} from '../api/promptApi';
import type {Prompt, PromptFilterParams} from '../types';

const DEBOUNCE_MS = 300;

export function usePromptSearch() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<PromptFilterParams>({});
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchWithSearch = useCallback(async (query: string, currentFilters: PromptFilterParams) => {
        try {
            setLoading(true);
            setError(null);
            const hasFilters = currentFilters.folderId || currentFilters.tagId || currentFilters.favorite !== undefined;

            let results: Prompt[];
            if (query.trim()) {
                results = await promptApi.search(query);
                if (hasFilters) {
                    results = results.filter(p => {
                        if (currentFilters.folderId && p.folderId !== currentFilters.folderId) return false;
                        if (currentFilters.tagId && !p.tagIds.includes(currentFilters.tagId)) return false;
                        if (currentFilters.favorite !== undefined && p.isFavorite !== currentFilters.favorite) return false;
                        return true;
                    });
                }
            } else if (hasFilters) {
                results = await promptApi.filter(currentFilters);
            } else {
                results = await promptApi.getAll();
            }

            setPrompts(results);
        } catch {
            setError('Failed to load prompts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchWithSearch(searchQuery, filters);
        }, searchQuery ? DEBOUNCE_MS : 0);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchQuery, filters, fetchWithSearch]);

    return {
        prompts,
        loading,
        error,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        refresh: () => fetchWithSearch(searchQuery, filters),
    };
}
