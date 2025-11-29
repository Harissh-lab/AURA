"""Routes for the AURA mental health application."""
from flask import Blueprint, render_template, request, jsonify
from app.mental_health import (
    detect_emotional_state,
    analyze_assessment,
    get_daily_affirmation,
    ASSESSMENT_QUESTIONS,
    COPING_STRATEGIES
)

bp = Blueprint("main", __name__)


@bp.route("/")
def index():
    """Render the main page of the application."""
    affirmation = get_daily_affirmation()
    return render_template("index.html", affirmation=affirmation)


@bp.route("/chat", methods=["POST"])
def chat():
    """Process chat messages and return supportive responses."""
    data = request.get_json()
    message = data.get("message", "")

    if not message:
        return jsonify({"error": "No message provided"}), 400

    response_data = detect_emotional_state(message)
    return jsonify(response_data)


@bp.route("/assessment")
def assessment():
    """Render the mental health assessment page."""
    return render_template("assessment.html", questions=ASSESSMENT_QUESTIONS)


@bp.route("/assessment/submit", methods=["POST"])
def submit_assessment():
    """Process and analyze the assessment responses."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    results = analyze_assessment(data)
    return jsonify(results)


@bp.route("/resources")
def resources():
    """Render the mental health resources page."""
    return render_template(
        "resources.html",
        coping_strategies=COPING_STRATEGIES
    )


@bp.route("/api/affirmation")
def api_affirmation():
    """Return a random daily affirmation."""
    return jsonify({"affirmation": get_daily_affirmation()})
