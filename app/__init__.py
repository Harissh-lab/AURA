"""AURA - Mental Health Application"""
from flask import Flask


def create_app():
    """Create and configure the Flask application."""
    app = Flask(
        __name__,
        template_folder="../templates",
        static_folder="../static"
    )
    app.config["SECRET_KEY"] = "aura-mental-health-secret-key"

    from app import routes
    app.register_blueprint(routes.bp)

    return app
