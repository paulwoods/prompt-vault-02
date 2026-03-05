import React, {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import type {PublicShare} from '../types';
import {shareLinkApi} from '../api/shareLinkApi';

interface PublicSharePageProps {
    token: string;
}

export const PublicSharePage: React.FC<PublicSharePageProps> = ({token}) => {
    const [share, setShare] = useState<PublicShare | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        shareLinkApi.getPublic(token)
            .then(setShare)
            .catch(() => setError('This link is invalid, expired, or has been revoked.'))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <span className="text-gray-400 text-sm">Loading…</span>
            </div>
        );
    }

    if (error || !share) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">404</div>
                    <p className="text-gray-500 text-sm">{error ?? 'Prompt not found'}</p>
                    <a
                        href="/"
                        className="mt-4 inline-block text-sm text-yellow-600 hover:underline"
                    >
                        Go to Prompt Vault
                    </a>
                </div>
            </div>
        );
    }

    const plainBody = share.body.replace(/<[^>]+>/g, '');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
                <a href="/" className="text-yellow-400 font-bold text-lg no-underline">
                    Prompt Vault
                </a>
                <a
                    href={shareLinkApi.exportUrl(token)}
                    download
                    className="text-sm bg-yellow-400 text-gray-900 px-3 py-1.5 rounded-md font-medium hover:bg-yellow-300 transition-colors no-underline"
                >
                    Export .txt
                </a>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{share.title}</h1>
                    <p className="text-xs text-gray-400 mb-6">
                        Shared {new Date(share.sharedAt).toLocaleString()}
                    </p>
                    <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>{plainBody}</ReactMarkdown>
                    </div>
                </div>
            </main>
        </div>
    );
};
