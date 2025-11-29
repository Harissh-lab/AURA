"""Tests for AURA Flask routes."""
import pytest
from app import create_app


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    yield app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


class TestRoutes:
    """Tests for Flask routes."""

    def test_index_page(self, client):
        """Test that the index page loads successfully."""
        response = client.get("/")
        assert response.status_code == 200
        assert b"AURA" in response.data

    def test_assessment_page(self, client):
        """Test that the assessment page loads successfully."""
        response = client.get("/assessment")
        assert response.status_code == 200
        assert b"Assessment" in response.data

    def test_resources_page(self, client):
        """Test that the resources page loads successfully."""
        response = client.get("/resources")
        assert response.status_code == 200
        assert b"Resources" in response.data

    def test_chat_endpoint(self, client):
        """Test the chat endpoint with a message."""
        response = client.post(
            "/chat",
            json={"message": "I feel sad today"},
            content_type="application/json"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "response" in data
        assert "strategies" in data

    def test_chat_endpoint_empty_message(self, client):
        """Test the chat endpoint with an empty message."""
        response = client.post(
            "/chat",
            json={"message": ""},
            content_type="application/json"
        )
        assert response.status_code == 400

    def test_assessment_submit(self, client):
        """Test the assessment submission endpoint."""
        responses = {
            "1": "7",
            "2": "Good",
            "3": "A little",
            "4": "Sometimes",
            "5": "Not at all"
        }
        response = client.post(
            "/assessment/submit",
            json=responses,
            content_type="application/json"
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "score" in data
        assert "status" in data
        assert "strategies" in data

    def test_affirmation_api(self, client):
        """Test the affirmation API endpoint."""
        response = client.get("/api/affirmation")
        assert response.status_code == 200
        data = response.get_json()
        assert "affirmation" in data
        assert len(data["affirmation"]) > 0
