import { useState, useEffect } from 'react';
import { generateSyllabus, getTopics, getResources, addUrlResource, uploadPdfResource, getModels } from './api';
import type { Topic, Resource, LLMModel } from './api';
import './App.css';

// Component to display details of a selected topic
const TopicDetails = ({ topic, onClose, selectedModel }: { topic: Topic, onClose: () => void, selectedModel?: string }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [newUrl, setNewUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        loadResources();
    }, [topic]);

    const loadResources = async () => {
        try {
            const data = await getResources(topic.id);
            setResources(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddUrl = async () => {
        if (!newUrl) return;
        setIsUploading(true);
        try {
            await addUrlResource(topic.id, newUrl, selectedModel);
            await loadResources();
            setNewUrl("");
        } catch (e) {
            alert("Error adding URL: " + e);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsUploading(true);
        try {
            await uploadPdfResource(topic.id, e.target.files[0], selectedModel);
            await loadResources();
        } catch (e) {
            alert("Error uploading PDF: " + e);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div style={{ 
            position: 'fixed', top: 0, right: 0, width: '400px', height: '100%', 
            backgroundColor: '#fff', boxShadow: '-2px 0 5px rgba(0,0,0,0.1)', 
            padding: '20px', overflowY: 'auto', zIndex: 1000, color: '#333'
        }}>
            <button onClick={onClose} style={{ float: 'right' }}>Close</button>
            <h2 style={{ marginTop: 0 }}>{topic.title}</h2>
            <p>{topic.description}</p>
            
            <h3>Resources</h3>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
                <input 
                    type="text" 
                    value={newUrl} 
                    onChange={e => setNewUrl(e.target.value)} 
                    placeholder="Add URL..." 
                    style={{ flex: 1, padding: '5px' }}
                />
                <button onClick={handleAddUrl} disabled={isUploading}>Add</button>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <label>Upload PDF: </label>
                <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
            </div>

            {isUploading && <p>Processing with {selectedModel || 'default model'}...</p>}
// ... (rest of TopicDetails remains similar)

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {resources.map(res => (
                    <li key={res.id} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <div style={{wordBreak: 'break-all'}}>
                            <strong>[{res.type.toUpperCase()}]</strong> 
                            {res.type === 'url' ? (
                                <a href={res.path_or_url} target="_blank" rel="noreferrer" style={{ marginLeft: '5px' }}>
                                    {res.path_or_url}
                                </a>
                            ) : (
                                <span style={{ marginLeft: '5px' }}>{res.path_or_url}</span>
                            )}
                        </div>
                        {res.content_summary && (
                            <div style={{ fontSize: '0.9em', color: '#555', marginTop: '5px' }}>
                                <strong>Summary:</strong> {res.content_summary}
                            </div>
                        )}
                    </li>
                ))}
                {resources.length === 0 && !isUploading && <p>No resources yet.</p>}
            </ul>
        </div>
    );
};

const TopicNode = ({ topic, allTopics, onSelect }: { topic: Topic, allTopics: Topic[], onSelect: (t: Topic) => void }) => {
    const children = allTopics
        .filter(t => t.parent_id === topic.id)
        .sort((a, b) => a.order_index - b.order_index);

    return (
        <div style={{ marginLeft: '20px', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
            <div 
                style={{ cursor: 'pointer', margin: '5px 0', padding: '4px', borderRadius: '4px' }}
                onClick={() => onSelect(topic)}
                className="topic-item"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <span style={{ fontWeight: children.length > 0 ? 'bold' : 'normal' }}>{topic.title}</span>
                {topic.description && <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '8px' }}>- {topic.description}</span>}
            </div>
            {children.map(child => (
                <TopicNode key={child.id} topic={child} allTopics={allTopics} onSelect={onSelect} />
            ))}
        </div>
    );
};

function App() {
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [models, setModels] = useState<LLMModel[]>([]);
    const [selectedModel, setSelectedModel] = useState("");

    useEffect(() => {
        loadTopics();
        loadModels();
    }, []);

    const loadTopics = async () => {
        try {
            const data = await getTopics();
            setTopics(data);
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

    const rootTopics = topics.filter(t => !t.parent_id);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
            <h1>Autodidact</h1>
            <p>Enter a topic to generate a learning syllabus.</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Quantum Computing, Introduction to Pottery..."
                    style={{ flex: 1, padding: '8px', fontSize: '16px', minWidth: '200px' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                
                <select 
                    value={selectedModel} 
                    onChange={e => setSelectedModel(e.target.value)}
                    style={{ padding: '8px', fontSize: '14px' }}
                >
                    {models.map(m => (
                        <option key={m.name} value={m.name}>{m.display_name}</option>
                    ))}
                    {models.length === 0 && <option value="">Loading models...</option>}
                </select>

                <button 
                    onClick={handleGenerate} 
                    disabled={isLoading}
                    style={{ padding: '8px 16px', fontSize: '16px', cursor: isLoading ? 'wait' : 'pointer' }}
                >
                    {isLoading ? "Generating..." : "Generate"}
                </button>
            </div>

            <hr />

            <h2>My Learning Paths</h2>
            {topics.length === 0 && <p style={{ color: '#888' }}>No topics yet. Start by generating one!</p>}
            
            <div>
                {rootTopics.map(root => (
                    <TopicNode key={root.id} topic={root} allTopics={topics} onSelect={setSelectedTopic} />
                ))}
            </div>

            {selectedTopic && (
                <TopicDetails 
                    topic={selectedTopic} 
                    onClose={() => setSelectedTopic(null)} 
                    selectedModel={selectedModel}
                />
            )}
        </div>
    );
}

export default App;