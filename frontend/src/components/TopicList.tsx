import type { Topic } from '../api';

interface TopicNodeProps {
    topic: Topic;
    allTopics: Topic[];
    onSelect: (t: Topic) => void;
    showAll: boolean;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
}

const TopicList = ({ topic, allTopics, onSelect, showAll, expandedIds, toggleExpand }: TopicNodeProps) => {
    const children = allTopics
        .filter(t => t.parent_id === topic.id)
        .sort((a, b) => a.order_index - b.order_index);

    const isExpanded = expandedIds.has(topic.id);
    const hasChildren = children.length > 0;

    if (!showAll && topic.status === 'completed') {
        return null; // Don't show completed topics unless requested
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
                        <TopicList
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

export default TopicList;
