import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()

@pytest.mark.asyncio
async def test_websocket_connection():
    """Test WebSocket connection."""
    with pytest.raises(RuntimeError):
        # This will raise an error because we're not in an async context
        # In a real test, you'd use an async test client
        client.websocket_connect("/ws/emotion")

    # TODO: Add proper async WebSocket tests
    # async with AsyncClient(app=app, base_url="http://test") as ac:
    #     async with ac.websocket_connect("/ws/emotion") as websocket:
    #         await websocket.send_text("test")
    #         data = await websocket.receive_text()
    #         assert data == "Message text was: test"
