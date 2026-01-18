from fastapi.testclient import TestClient

def test_generate_topic_mock(client: TestClient):
    # This tests the endpoint without a real API key (unless set in env),
    # verifying that the fallback logic or structure works.
    response = client.post("/topics/generate?prompt=TestTopic")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["title"] == "TestTopic"
    # Depending on whether API_KEY is present, the structure differs slightly in content,
    # but the schema should hold.
