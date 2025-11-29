"""
Integration tests for CheckmateAI API endpoints.
Run with: pytest tests/test_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Create mock objects
mock_supabase = MagicMock()
mock_supabase.client = MagicMock()
mock_supabase.get_verification_history = AsyncMock(return_value=[])
mock_supabase.get_threat_feed = AsyncMock(return_value=[])
mock_supabase.get_latest_vaccine_digest = AsyncMock(return_value=None)
mock_supabase.get_vaccine_digest_archive = AsyncMock(return_value=[])
mock_supabase.get_recent_threats = AsyncMock(return_value=[])


@pytest.fixture
def client():
    """Create test client with mocked database."""
    # Patch where supabase_db is USED (in routers), not where it's defined
    with patch("app.routers.verify.supabase_db", mock_supabase), \
         patch("app.routers.feed.supabase_db", mock_supabase), \
         patch("app.routers.vaccine.get_latest_digest", AsyncMock(return_value=None)), \
         patch("app.routers.vaccine.get_digest_archive", AsyncMock(return_value=[])), \
         patch("app.agents.feed_agent.graph_analysis.get_topic_clusters", AsyncMock(return_value=[])), \
         patch("app.db.supabase.supabase_db.client", MagicMock()), \
         patch("app.db.neo4j.neo4j_db.is_connected", MagicMock(return_value=False)):
        
        from app.main import app
        yield TestClient(app)


class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert data["name"] == "CheckmateAI API"
    
    def test_health_endpoint(self, client):
        """Test health endpoint returns status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert "timestamp" in data
    
    def test_api_status(self, client):
        """Test API status endpoint."""
        response = client.get("/api/status")
        assert response.status_code == 200
        assert response.json()["status"] == "operational"


class TestVerificationEndpoints:
    """Tests for verification endpoints."""
    
    def test_verify_missing_text(self, client):
        """Test verify endpoint requires text."""
        response = client.post("/api/verify", json={})
        assert response.status_code == 422
    
    def test_verify_empty_text(self, client):
        """Test verify endpoint rejects empty text."""
        response = client.post("/api/verify", json={"text": ""})
        assert response.status_code == 422
    
    def test_verify_history_endpoint(self, client):
        """Test verification history endpoint."""
        response = client.get("/api/verify/history")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_verify_history_pagination(self, client):
        """Test history endpoint accepts pagination params."""
        response = client.get("/api/verify/history?limit=5&offset=0")
        assert response.status_code == 200


class TestFeedEndpoints:
    """Tests for threat feed endpoints."""
    
    def test_get_feed(self, client):
        """Test feed endpoint returns list."""
        response = client.get("/api/feed")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_feed_with_limit(self, client):
        """Test feed endpoint accepts limit."""
        response = client.get("/api/feed?limit=5")
        assert response.status_code == 200
    
    def test_feed_intensity_filter_valid(self, client):
        """Test feed intensity filter with valid level."""
        response = client.get("/api/feed/intensity/high")
        assert response.status_code == 200
    
    def test_feed_intensity_filter_invalid(self, client):
        """Test feed intensity filter rejects invalid level."""
        response = client.get("/api/feed/intensity/extreme")
        assert response.status_code == 400
    
    def test_trending_endpoint(self, client):
        """Test trending endpoint."""
        response = client.get("/api/feed/trending")
        assert response.status_code == 200


class TestVaccineEndpoints:
    """Tests for vaccine digest endpoints."""
    
    def test_latest_vaccine_not_found(self, client):
        """Test latest vaccine returns 404 when no digest exists."""
        response = client.get("/api/vaccine/latest")
        assert response.status_code == 404
    
    def test_vaccine_archive(self, client):
        """Test vaccine archive endpoint."""
        response = client.get("/api/vaccine/archive")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_vaccine_archive_pagination(self, client):
        """Test vaccine archive accepts pagination."""
        response = client.get("/api/vaccine/archive?limit=5&offset=0")
        assert response.status_code == 200


class TestSchemaValidation:
    """Tests for request/response schema validation."""
    
    def test_verify_request_with_image(self, client):
        """Test verify request accepts image_base64."""
        response = client.post("/api/verify", json={
            "text": "Test claim",
            "image_base64": "base64encodedstring",
            "language": "en"
        })
        assert response.status_code in [200, 500]
    
    def test_verify_request_language(self, client):
        """Test verify request accepts different languages."""
        response = client.post("/api/verify", json={
            "text": "Test claim",
            "language": "hi"
        })
        assert response.status_code in [200, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
