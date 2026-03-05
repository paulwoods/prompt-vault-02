import {useState} from 'react';
import {Sidebar} from './components/Sidebar';
import {PromptList} from './components/PromptList';
import {HomePage} from './components/HomePage';

function App() {
    const [showApp, setShowApp] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

    if (!showApp) {
        return <HomePage onGetStarted={() => setShowApp(true)}/>;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar
                onFolderSelect={id => {
                    setSelectedFolderId(id);
                    setSelectedTagId(null);
                }}
                selectedFolderId={selectedFolderId}
                onTagSelect={id => {
                    setSelectedTagId(id);
                    setSelectedFolderId(null);
                }}
                selectedTagId={selectedTagId}
            />
            <main className="flex-1 overflow-hidden">
                <PromptList
                    folderId={selectedFolderId}
                    tagId={selectedTagId}
                />
            </main>
        </div>
    );
}

export default App;
