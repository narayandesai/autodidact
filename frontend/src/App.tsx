import { useState, useEffect } from 'react';
import { generateSyllabus, getTopics, getModels } from './api';
import type { Topic, LLMModel } from './api';
import './App.css';
import TopicList from './components/TopicList';
import TopicDetail from './components/TopicDetail';

function App() {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [models, setModels] = useState<LLMModel[]>([]);
    const [selectedModel, setSelectedModel] = useState("");
    const [showAll, setShowAll] = useState(false);

    // Folding State
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadTopics();
        loadModels();
    }, []);

    const loadTopics = async () => {
        try {
            const data = await getTopics();
            setTopics(data);
            // If selected topic exists, update it with fresh data
            if (selectedTopic) {
                const fresh = data.find(t => t.id === selectedTopic.id);
                if (fresh) setSelectedTopic(fresh);
            }

            // Auto-expand root topics on initial load if set is empty
            if (expandedIds.size === 0 && data.length > 0) {
                const roots = data.filter(t => !t.parent_id);
                setExpandedIds(new Set(roots.map(r => r.id)));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadModels = async () => {
        try {
            const data = await getModels();
            setModels(data);
            if (data.length > 0) {
                // Try to find gemini-1.5-flash as default, else first one
                const flash = data.find(m => m.name.includes('gemini-1.5-flash'));
                setSelectedModel(flash ? flash.name : data[0].name);
            }
        } catch (e) {
            console.error("Failed to load models", e);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        try {
            await generateSyllabus(prompt, selectedModel);
            await loadTopics(); // Reload to see the new tree
            setPrompt("");
        } catch (e) {
            alert("Error generating syllabus: " + e);
        } finally {
            setIsLoading(false);
        }
    };

    // Folding Logic
    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedIds(newSet);
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    const rootTopics = topics.filter(t => !t.parent_id);

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Left Column (Syllabus) */}
            <div style={{
                flex: selectedTopic ? '0 0 25%' : '1 1 auto',
                maxWidth: selectedTopic ? '25%' : '800px',
                margin: selectedTopic ? '0' : '0 auto',
                padding: '20px',
                overflowY: 'auto',
                borderRight: selectedTopic ? '1px solid #ddd' : 'none',
                transition: 'all 0.3s ease'
            }}>
                <h1>Autodidact</h1>
                <p>Enter a topic to generate a learning syllabus.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Quantum Computing..."
                            style={{ flex: 1, padding: '8px', fontSize: '16px' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            style={{ padding: '8px 16px' }}
                        >
                            {isLoading ? "..." : "Gen"}
                        </button>
                    </div>

                    <select
                        value={selectedModel}
                        onChange={e => setSelectedModel(e.target.value)}
                        style={{ padding: '8px', fontSize: '14px', width: '100%' }}
                    >
                        {models.map(m => (
                            <option key={m.name} value={m.name}>{m.display_name}</option>
                        ))}
                    </select>
                </div>

                <hr />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <h2 style={{ fontSize: '1.2em', margin: 0 }}>Paths</h2>
                        <button onClick={collapseAll} style={{ padding: '2px 6px', fontSize: '0.7em' }}>
                            Collapse All
                        </button>
                    </div>
                    <label style={{ fontSize: '0.8em', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showAll}
                            onChange={e => setShowAll(e.target.checked)}
                            style={{ marginRight: '5px' }}
                        />
                        Show Learned
                    </label>
                </div>

                {topics.length === 0 && <p style={{ color: '#888' }}>No topics yet.</p>}

                <div>
                    {rootTopics.map(root => (
                        <TopicList
                            key={root.id}
                            topic={root}
                            allTopics={topics}
                            onSelect={setSelectedTopic}
                            showAll={showAll}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>
            </div>

            {/* Right Column (Details) */}
            {selectedTopic && (
                <div style={{ flex: '1 1 75%', overflow: 'hidden' }}>
                    <TopicDetail
                        topic={selectedTopic}
                        onClose={() => setSelectedTopic(null)}
                        selectedModel={selectedModel}
                        onUpdate={loadTopics}
                    />
                </div>
            )}
        </div>
    );
}

export default App;