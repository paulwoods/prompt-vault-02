import React from 'react';

interface HomePageProps {
    onGetStarted: () => void;
}

const features = [
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
        ),
        title: 'Prompt Library',
        description: 'Organize all your prompts in one secure place. Create folders, add tags, and find anything instantly.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
        ),
        title: 'Version History',
        description: 'Every change is tracked. Roll back to any previous version of your prompt with a single click.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
        ),
        title: 'Full-Text Search',
        description: 'Find any prompt in milliseconds with ranked full-text search across titles and content.',
    },
    {
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
        ),
        title: 'Share & Collaborate',
        description: 'Share prompts via secure links with configurable expiration. Fork and build on others\' work.',
    },
];

export const HomePage: React.FC<HomePageProps> = ({onGetStarted}) => {
    return (
        <div className="min-h-screen bg-white flex flex-col">

            {/* Nav */}
            <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                                <path fillRule="evenodd"
                                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 000-2h-3z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                        <span className="font-semibold text-gray-900 text-lg">Prompt Vault</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium px-0 py-0 bg-transparent border-none cursor-pointer"
                        >
                            Sign in
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors font-medium border-none cursor-pointer"
                        >
                            Get started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-24 text-center">
                    <span
                        className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-6">
                        Enterprise-grade prompt management
                    </span>
                    <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6 max-w-3xl mx-auto">
                        Store, version, and search your AI prompts
                    </h1>
                    <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Prompt Vault gives teams a single source of truth for every AI prompt — with version control,
                        full-text search, and secure sharing built in.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="bg-gray-900 text-white px-8 py-3 rounded-md text-base font-medium hover:bg-gray-700 transition-colors border-none cursor-pointer"
                        >
                            Open Vault
                        </button>
                        <a href="#features"
                           className="text-gray-600 font-medium text-base hover:text-gray-900 transition-colors">
                            See features →
                        </a>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mb-14">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything your team needs</h2>
                    <p className="text-gray-500 text-lg">Built for engineers and prompt engineers who take their work
                        seriously.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((f) => (
                        <div key={f.title}
                             className="p-6 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow">
                            <div
                                className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-yellow-400 mb-4">
                                {f.icon}
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats bar */}
            <section className="bg-gray-900 py-14">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                        {[
                            {value: '50', unit: 'versions', label: 'Per prompt, fully tracked'},
                            {value: '<500ms', unit: '', label: 'Full-text search latency'},
                            {value: '100%', unit: '', label: 'Private by default'},
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="text-4xl font-bold text-white mb-1">
                                    {stat.value}
                                    {stat.unit && <span className="text-yellow-400 ml-1 text-2xl">{stat.unit}</span>}
                                </div>
                                <div className="text-gray-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-6xl mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to organise your prompts?</h2>
                <p className="text-gray-500 text-lg mb-8">Get started in seconds. No setup required.</p>
                <button
                    onClick={onGetStarted}
                    className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-md text-base font-semibold hover:bg-yellow-300 transition-colors border-none cursor-pointer"
                >
                    Open Prompt Vault
                </button>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 mt-auto">
                <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-gray-400">
                    <span>© {new Date().getFullYear()} Prompt Vault</span>
                    <span>Built for teams who build with AI.</span>
                </div>
            </footer>
        </div>
    );
};
