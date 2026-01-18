from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models import Topic

def test_add_url_resource(client: TestClient, session: Session):
    topic = Topic(title="Test Topic", description="Desc")
    session.add(topic)
    session.commit()
    session.refresh(topic)

    with patch("app.routers.resources.ingest.extract_text_from_url") as mock_extract:
        mock_extract.return_value = "Mock content from URL."
        
        response = client.post(
            "/resources/add/url", 
            params={"topic_id": str(topic.id), "url": "http://example.com"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "url"
        assert data["topic_id"] == str(topic.id)
        assert "Mock content" in data["raw_content"]

def test_get_resources(client: TestClient, session: Session):
    topic = Topic(title="Test Topic 2", description="Desc")
    session.add(topic)
    session.commit()
    session.refresh(topic)
    
    # Add resource via API (or directly to DB)
    # Let's add directly to DB to keep test simple
    from app.models import Resource, ResourceType
    res = Resource(
        topic_id=topic.id, 
        type=ResourceType.TEXT, 
        path_or_url="test", 
        raw_content="Content"
    )
    session.add(res)
    session.commit()
    
    response = client.get(f"/resources/topic/{topic.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == str(res.id)
