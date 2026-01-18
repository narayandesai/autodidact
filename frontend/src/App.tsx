import { useState, useEffect } from 'react';
import { generateSyllabus, getTopics, getResources, addUrlResource, uploadPdfResource, getModels, updateTopicStatus } from './api';
import type { Topic, Resource, LLMModel } from './api';
import './App.css';

// Component to display details of a selected topic
const TopicDetails = ({ topic, onClose, selectedModel, onUpdate }: { topic: Topic, onClose: () => void, selectedModel?: string, onUpdate: () => void }) => {
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

    const toggleStatus = async () => {
        const newStatus = topic.status === 'completed' ? 'pending' : 'completed';
        try {
            await updateTopicStatus(topic.id, newStatus);
            onUpdate(); // Refresh parent list
            // Note: We are relying on the parent to refresh 'topic' prop eventually, 
            // but for now the parent closes or re-renders details.
        } catch(e) {
            alert("Error updating status: " + e);
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
            <div style={{ marginBottom: '15px' }}>
                <span 
                    style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em',
                        backgroundColor: topic.status === 'completed' ? '#d4edda' : '#fff3cd',
                        color: topic.status === 'completed' ? '#155724' : '#856404',
                        border: '1px solid transparent'
                    }}
                >
                    {topic.status.toUpperCase()}
                </span>
                <button 
                    onClick={toggleStatus} 
                    style={{ marginLeft: '10px', fontSize: '0.8em', padding: '2px 8px' }}
                >
                    Mark as {topic.status === 'completed' ? 'Pending' : 'Learned'}
                </button>
            </div>
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

const TopicNode = ({ topic, allTopics, onSelect, showAll }: { topic: Topic, allTopics: Topic[], onSelect: (t: Topic) => void, showAll: boolean }) => {
    const children = allTopics
        .filter(t => t.parent_id === topic.id)
        .sort((a, b) => a.order_index - b.order_index);

    // If a parent is "Completed" but we are not showing all, should we hide it?
    // The requirement says: "When an item is learned, it is hidden in the default view"
    
    // However, if a child is learned but parent is not, we might still want to see the parent.
    // So filtering should happen at the render level.
    
    // Note: If a parent is hidden, its children are naturally hidden in this recursive structure.
    // But if a parent is "Pending" and child is "Completed", we want to show parent, and hide child (unless showAll).

    if (!showAll && topic.status === 'completed') {
        return null;
    }

    return (
        <div style={{ marginLeft: '20px', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
            <div 
                style={{ 
                    cursor: 'pointer', margin: '5px 0', padding: '4px', borderRadius: '4px',
                    opacity: topic.status === 'completed' ? 0.6 : 1
                }}
                onClick={() => onSelect(topic)}
                className="topic-item"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
                <span style={{ 
                    fontWeight: children.length > 0 ? 'bold' : 'normal',
                    textDecoration: topic.status === 'completed' ? 'line-through' : 'none'
                }}>
                    {topic.title}
                </span>
                {topic.description && <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '8px' }}>- {topic.description}</span>}
            </div>
            {children.map(child => (
                <TopicNode key={child.id} topic={child} allTopics={allTopics} onSelect={onSelect} showAll={showAll} />
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
    const [showAll, setShowAll] = useState(false);

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
        } catch (e) {
            console.error(e);
        }
    };
// ... (rest of App component)

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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>My Learning Paths</h2>
                <label style={{ fontSize: '0.9em', cursor: 'pointer' }}>
                    <input 
                        type="checkbox" 
                        checked={showAll} 
                        onChange={e => setShowAll(e.target.checked)} 
                        style={{ marginRight: '5px' }}
                    />
                    Show Learned
                </label>
            </div>

            {topics.length === 0 && <p style={{ color: '#888' }}>No topics yet. Start by generating one!</p>}
            
            <div>
                {rootTopics.map(root => (
                    <TopicNode 
                        key={root.id} 
                        topic={root} 
                        allTopics={topics} 
                        onSelect={setSelectedTopic} 
                        showAll={showAll}
                    />
                ))}
            </div>

            {selectedTopic && (
                <TopicDetails 
                    topic={selectedTopic} 
                    onClose={() => setSelectedTopic(null)} 
                    selectedModel={selectedModel}
                    onUpdate={loadTopics}
                />
            )}
        </div>
    );
}

export default App;