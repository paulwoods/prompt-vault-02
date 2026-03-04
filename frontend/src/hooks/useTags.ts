import {useEffect, useState} from 'react';
import {tagApi} from '../api/tagApi';
import {Tag, TagRequest} from '../types';

export function useTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const data = await tagApi.getAll();
            setTags(data);
            setError(null);
        } catch (err) {
            setError('Failed to load tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    const createTag = async (request: TagRequest) => {
        try {
            const newTag = await tagApi.create(request);
            setTags([...tags, newTag]);
            return newTag;
        } catch (err) {
            setError('Failed to create tag');
            throw err;
        }
    };

    const updateTag = async (id: string, request: TagRequest) => {
        try {
            const updatedTag = await tagApi.update(id, request);
            setTags(tags.map(t => t.id === id ? updatedTag : t));
            return updatedTag;
        } catch (err) {
            setError('Failed to update tag');
            throw err;
        }
    };

    const deleteTag = async (id: string) => {
        try {
            await tagApi.delete(id);
            setTags(tags.filter(t => t.id !== id));
        } catch (err) {
            setError('Failed to delete tag');
            throw err;
        }
    };

    return {tags, loading, error, createTag, updateTag, deleteTag, refreshTags: fetchTags};
}
