import { useState, useEffect } from 'react';
import {
    getConcepts, generateConcepts,
    getActivities, generateActivities,
    completeActivity
} from '../api';
import type { Concept, Activity } from '../api';

interface PedagogyViewProps {
    topicId: string;
    modelName?: string;
}

const PedagogyView = ({ topicId, modelName }: PedagogyViewProps) => {
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loadingConcepts, setLoadingConcepts] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);

    useEffect(() => {
        loadConcepts();
        setSelectedConcept(null);
        setActivities([]);
    }, [topicId]);

    useEffect(() => {
        if (selectedConcept) {
            loadActivities(selectedConcept.id);
        }
    }, [selectedConcept]);

    const loadConcepts = async () => {
        try {
            const data = await getConcepts(topicId);
            setConcepts(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerateConcepts = async () => {
        setLoadingConcepts(true);
        try {
            await generateConcepts(topicId, modelName);
            await loadConcepts();
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoadingConcepts(false);
        }
    };

    const loadActivities = async (conceptId: string) => {
        try {
            const data = await getActivities(conceptId);
            setActivities(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerateActivities = async () => {
        if (!selectedConcept) return;
        setLoadingActivities(true);
        try {
            await generateActivities(selectedConcept.id, modelName);
            await loadActivities(selectedConcept.id);
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleCompleteActivity = async (id: string, score: number) => {
        try {
            await completeActivity(id, score);
            // Update local state
            setActivities(activities.map(a =>
                a.id === id ? { ...a, status: 'completed', user_score: score } : a
            ));
        } catch (e) {
            alert("Error: " + e);
        }
    };

    return (
        <div style={{ marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
            <h3>Learning Path</h3>

            {/* Concepts Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ margin: 0 }}>Key Concepts</h4>
                <button
                    onClick={handleGenerateConcepts}
                    disabled={loadingConcepts}
                    style={{ fontSize: '0.8em', padding: '4px 8px' }}
                >
                    {loadingConcepts ? "Generating..." : "Generate Concepts"}
                </button>
            </div>

            {concepts.length === 0 && !loadingConcepts && <p style={{ color: '#888', fontSize: '0.9em' }}>No concepts yet.</p>}

            <ul style={{ listStyle: 'none', padding: 0 }}>
                {concepts.map(c => (
                    <li
                        key={c.id}
                        style={{
                            padding: '8px',
                            marginBottom: '5px',
                            backgroundColor: selectedConcept?.id === c.id ? '#e7f1ff' : '#f9f9f9',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        onClick={() => setSelectedConcept(c)}
                    >
                        <strong>{c.title}</strong>
                        <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: '#555' }}>{c.description}</p>
                    </li>
                ))}
            </ul>

            {/* Activities Section */}
            {selectedConcept && (
                <div style={{ marginTop: '20px', paddingLeft: '15px', borderLeft: '3px solid #007bff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0 }}>Activities for: {selectedConcept.title}</h4>
                        <button
                            onClick={handleGenerateActivities}
                            disabled={loadingActivities}
                            style={{ fontSize: '0.8em', padding: '4px 8px' }}
                        >
                            {loadingActivities ? "Generating..." : "Generate Tasks"}
                        </button>
                    </div>

                    {activities.length === 0 && !loadingActivities && <p style={{ color: '#888', fontSize: '0.9em' }}>No activities yet.</p>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {activities.map(a => (
                            <div key={a.id} style={{ border: '1px solid #eee', padding: '10px', borderRadius: '4px', backgroundColor: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 'bold', color: '#6610f2' }}>[{a.type.toUpperCase()}]</span>
                                    {a.status === 'completed' ? (
                                        <span style={{ color: 'green', fontSize: '0.8em' }}>✓ Done (Score: {a.user_score})</span>
                                    ) : (
                                        <span style={{ color: 'orange', fontSize: '0.8em' }}>Pending</span>
                                    )}
                                </div>
                                <p style={{ margin: '5px 0' }}>{a.instructions}</p>

                                {a.status !== 'completed' && (
                                    <div style={{ marginTop: '5px' }}>
                                        <span style={{ fontSize: '0.8em', marginRight: '5px' }}>Rate & Complete:</span>
                                        {[1, 2, 3, 4, 5].map(score => (
                                            <button
                                                key={score}
                                                onClick={() => handleCompleteActivity(a.id, score)}
                                                style={{ marginRight: '2px', padding: '2px 6px', fontSize: '0.7em' }}
                                            >
                                                {score}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PedagogyView;
