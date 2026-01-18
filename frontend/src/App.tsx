import { useState, useEffect } from 'react';
import { generateSyllabus, getTopics, getResources, addUrlResource, uploadPdfResource, getModels, updateTopicStatus, elaborateTopic, askTopic } from './api';
import type { Topic, Resource, LLMModel } from './api';
import './App.css';

// Component to display details of a selected topic
const TopicDetails = ({ topic, onClose, selectedModel, onUpdate }: { topic: Topic, onClose: () => void, selectedModel?: string, onUpdate: () => void }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [newUrl, setNewUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    
    // Assistant State
    const [assistantInput, setAssistantInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [chatResponse, setChatResponse] = useState<string | null>(null);

    useEffect(() => {
        loadResources();
        setChatResponse(null); // Clear chat on topic change
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
            onUpdate(); 
        } catch(e) {
            alert("Error updating status: " + e);
        }
    };

    // AI Actions
    const handleElaborate = async () => {
        setIsThinking(true);
        try {
            await elaborateTopic(topic.id, assistantInput, selectedModel);
            onUpdate(); // Refresh parent to see new subtopics/description
            await loadResources(); // Refresh resources
            setAssistantInput(""); // Clear input if it was used as context
            setChatResponse("Topic expanded successfully! Check the description, sub-topics, and resources.");
        } catch(e) {
            alert("Error elaborating: " + e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleAsk = async () => {
        if (!assistantInput) return;
        setIsThinking(true);
        try {
            const res = await askTopic(topic.id, assistantInput, selectedModel);
            setChatResponse(res.answer);
        } catch (e) {
            alert("Error asking: " + e);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div style={{ 
            height: '100%', 
            borderLeft: '1px solid #ddd', 
            padding: '20px', 
            backgroundColor: '#fff', 
            overflowY: 'auto',
            color: '#333',
            display: 'flex', flexDirection: 'column'
        }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h2 style={{ marginTop: 0, marginRight: '10px' }}>{topic.title}</h2>
                    <button onClick={onClose}>Close</button>
                </div>
                
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                        style={{ fontSize: '0.8em', padding: '4px 8px' }}
                    >
                        {topic.status === 'completed' ? 'Mark Pending' : 'Mark Learned'}
                    </button>
                    <button 
                        onClick={handleElaborate}
                        disabled={isThinking}
                        style={{ fontSize: '0.8em', padding: '4px 8px', backgroundColor: '#e7f1ff', color: '#004085', border: '1px solid #b8daff' }}
                    >
                        {isThinking ? "Thinking..." : "✨ Elaborate & Expand"}
                    </button>
                </div>

                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#444', marginBottom: '20px' }}>
                    {topic.description || <em>No description yet. Click 'Elaborate' to generate one.</em>}
                </div>
                
                <h3>Resources</h3>
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
                    {resources.length === 0 && !isUploading && <p style={{ color: '#888' }}>No resources yet.</p>}
                </ul>

                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <h4>Add Resource</h4>
                    <div style={{ marginBottom: '10px', display: 'flex', gap: '5px' }}>
                        <input 
                            type="text" 
                            value={newUrl} 
                            onChange={e => setNewUrl(e.target.value)} 
                            placeholder="Paste URL..." 
                            style={{ flex: 1, padding: '5px' }}
                        />
                        <button onClick={handleAddUrl} disabled={isUploading}>Add</button>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.9em' }}>Upload PDF: </label>
                        <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
                    </div>
                    {isUploading && <p style={{ fontSize: '0.9em', color: '#666' }}>Processing...</p>}
                </div>
            </div>

            <div style={{ marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
                <h4>AI Assistant</h4>
                {chatResponse && (
                    <div style={{ 
                        backgroundColor: '#e9ecef', padding: '10px', borderRadius: '8px', 
                        marginBottom: '10px', fontSize: '0.95em', borderLeft: '4px solid #007bff'
                    }}>
                        {chatResponse}
                    </div>
                )}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <textarea 
                        value={assistantInput}
                        onChange={e => setAssistantInput(e.target.value)}
                        placeholder="Ask a question or give instructions for elaboration..."
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', minHeight: '60px' }}
                    />
                </div>
                <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <button onClick={handleElaborate} disabled={isThinking} title="Use input to guide topic expansion">
                        Refine Topic
                    </button>
                    <button onClick={handleAsk} disabled={isThinking} title="Ask a question about this topic">
                        Ask Question
                    </button>
                </div>
            </div>
        </div>
    );
};

interface TopicNodeProps {
    topic: Topic;
    allTopics: Topic[];
    onSelect: (t: Topic) => void;
    showAll: boolean;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}

const TopicNode = ({ topic, allTopics, onSelect, showAll, expandedIds, toggleExpand }: TopicNodeProps) => {
    const children = allTopics
        .filter(t => t.parent_id === topic.id)
        .sort((a, b) => a.order_index - b.order_index);

    const isExpanded = expandedIds.has(topic.id);
    const hasChildren = children.length > 0;

    if (!showAll && topic.status === 'completed') {
        return null;
    }

    return (
        <div style={{ marginLeft: '20px', borderLeft: '1px solid #eee', paddingLeft: '10px' }}>
            <div 
                className="topic-item"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '10px' }}
            >
                <div 
                    style={{ 
                        cursor: 'pointer', margin: '5px 0', padding: '4px', borderRadius: '4px',
                        opacity: topic.status === 'completed' ? 0.6 : 1,
                        flex: 1,
                        display: 'flex', alignItems: 'center'
                    }}
                    onClick={() => {
                        if (hasChildren) {
                            toggleExpand(topic.id);
                        }
                        onSelect(topic);
                    }}
                >
                    {hasChildren && (
                        <span style={{ marginRight: '5px', fontSize: '0.8em', width: '15px' }}>
                            {isExpanded ? '▼' : '▶'}
                        </span>
                    )}
                    <span style={{ 
                        fontWeight: hasChildren ? 'bold' : 'normal',
                        textDecoration: topic.status === 'completed' ? 'line-through' : 'none'
                    }}>
                        {topic.title}
                    </span>
                </div>
            </div>
            
            {hasChildren && isExpanded && (
                <div>
                    {children.map(child => (
                        <TopicNode 
                            key={child.id} 
                            topic={child} 
                            allTopics={allTopics} 
                            onSelect={onSelect} 
                            showAll={showAll}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>
            )}
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

    const collapseOthers = (topic: Topic) => {
        // Find siblings
        const siblings = topics.filter(t => t.parent_id === topic.parent_id && t.id !== topic.id);
        const newSet = new Set(expandedIds);
        // Remove siblings from expanded
        siblings.forEach(s => newSet.delete(s.id));
        // Ensure self is added
        newSet.add(topic.id);
        setExpandedIds(newSet);
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
                        <TopicNode 
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
                    <TopicDetails 
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