import { useState, useEffect } from 'react';
import { getResources, addUrlResource, uploadPdfResource, updateTopicStatus, elaborateTopic, askTopic } from '../api';
import type { Topic, Resource } from '../api';
import PedagogyView from './PedagogyView';

interface TopicDetailsProps {
    topic: Topic;
    onClose: () => void;
    selectedModel?: string;
    onUpdate: () => void;
}

const TopicDetails = ({ topic, onClose, selectedModel, onUpdate }: TopicDetailsProps) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [newUrl, setNewUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Assistant State
    const [assistantInput, setAssistantInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [chatResponse, setChatResponse] = useState<string | null>(null);

    useEffect(() => {
        loadResources();
        setChatResponse(null);
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
        } catch (e) {
            alert("Error updating status: " + e);
        }
    };

    const handleElaborate = async () => {
        setIsThinking(true);
        try {
            await elaborateTopic(topic.id, assistantInput, selectedModel);
            onUpdate();
            await loadResources();
            setAssistantInput("");
            setChatResponse("Topic expanded successfully! Check description and resources.");
        } catch (e) {
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

                {/* Resources */}
                <h3>Resources</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {resources.map(res => (
                        <li key={res.id} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <div style={{ wordBreak: 'break-all' }}>
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

                {/* Pedagogy View */}
                <PedagogyView topicId={topic.id} modelName={selectedModel} />

            </div>

            {/* AI Chat */}
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

export default TopicDetails;
