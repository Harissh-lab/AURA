"""Tests for the AURA mental health module."""
import pytest
from app.mental_health import (
    detect_emotional_state,
    analyze_assessment,
    get_daily_affirmation,
    ASSESSMENT_QUESTIONS,
    COPING_STRATEGIES,
    CRISIS_KEYWORDS
)


class TestEmotionalStateDetection:
    """Tests for the detect_emotional_state function."""

    def test_detect_sad_emotion(self):
        """Test detection of sadness in user message."""
        result = detect_emotional_state("I feel so sad today")
        assert result["emotion"] == "sad"
        assert result["is_crisis"] is False
        assert "sad" in result["response"].lower() or "sorry" in result["response"].lower()
        assert len(result["strategies"]) > 0

    def test_detect_anxious_emotion(self):
        """Test detection of anxiety in user message."""
        result = detect_emotional_state("I've been feeling very anxious lately")
        assert result["emotion"] == "anxious"
        assert result["category"] == "anxiety"
        assert len(result["strategies"]) > 0

    def test_detect_happy_emotion(self):
        """Test detection of positive emotions."""
        result = detect_emotional_state("I am feeling happy today!")
        assert result["emotion"] == "happy"
        assert result["category"] == "general_wellness"

    def test_detect_stressed_emotion(self):
        """Test detection of stress."""
        result = detect_emotional_state("Work has me feeling so stressed")
        assert result["emotion"] == "stressed"
        assert result["category"] == "stress"

    def test_crisis_detection(self):
        """Test detection of crisis keywords."""
        result = detect_emotional_state("I don't want to live anymore")
        assert result["is_crisis"] is True
        assert "988" in result["response"]
        assert result["category"] == "crisis"

    def test_neutral_message(self):
        """Test handling of neutral messages without emotional keywords."""
        result = detect_emotional_state("Hello, how are you?")
        assert result["emotion"] == "neutral"
        assert result["is_crisis"] is False
        assert len(result["strategies"]) > 0

    def test_case_insensitivity(self):
        """Test that emotion detection is case-insensitive."""
        result1 = detect_emotional_state("I am SAD")
        result2 = detect_emotional_state("i am sad")
        assert result1["emotion"] == result2["emotion"]

    def test_multiple_emotions_first_wins(self):
        """Test that when multiple emotions are present, one is detected."""
        result = detect_emotional_state("I feel sad and anxious")
        # Should detect one of the emotions
        assert result["emotion"] in ["sad", "anxious"]


class TestAssessmentAnalysis:
    """Tests for the analyze_assessment function."""

    def test_excellent_score(self):
        """Test analysis of excellent mental health responses."""
        responses = {
            "1": "9",
            "2": "Excellent",
            "3": "Not at all",
            "4": "Never",
            "5": "Not at all"
        }
        result = analyze_assessment(responses)
        assert result["status"] == "excellent"
        assert result["score"] >= 80

    def test_concerning_score(self):
        """Test analysis of concerning mental health responses."""
        responses = {
            "1": "2",
            "2": "Poor",
            "3": "Quite a bit",
            "4": "Often",
            "5": "Quite a bit"
        }
        result = analyze_assessment(responses)
        assert result["status"] in ["concerning", "needs_attention"]
        assert result["score"] < 40

    def test_moderate_score(self):
        """Test analysis of moderate mental health responses."""
        responses = {
            "1": "5",
            "2": "Average",
            "3": "Moderately",
            "4": "Sometimes",
            "5": "A little"
        }
        result = analyze_assessment(responses)
        assert result["status"] in ["moderate", "good"]
        assert 30 <= result["score"] <= 70

    def test_partial_responses(self):
        """Test analysis with incomplete responses."""
        responses = {
            "1": "7",
            "2": "Good"
        }
        result = analyze_assessment(responses)
        assert "score" in result
        assert "status" in result
        assert "strategies" in result

    def test_empty_responses(self):
        """Test analysis with no responses."""
        result = analyze_assessment({})
        assert result["score"] == 0
        assert result["status"] == "needs_attention"

    def test_result_contains_strategies(self):
        """Test that results always contain strategies."""
        responses = {"1": "5"}
        result = analyze_assessment(responses)
        assert isinstance(result["strategies"], list)
        assert len(result["strategies"]) > 0


class TestDailyAffirmation:
    """Tests for the get_daily_affirmation function."""

    def test_affirmation_returns_string(self):
        """Test that affirmation returns a non-empty string."""
        affirmation = get_daily_affirmation()
        assert isinstance(affirmation, str)
        assert len(affirmation) > 0

    def test_affirmation_is_positive(self):
        """Test that affirmations contain positive content."""
        # Run multiple times to test randomness
        for _ in range(5):
            affirmation = get_daily_affirmation()
            # Should not contain negative words
            negative_words = ["never", "can't", "won't", "hate"]
            assert not any(word in affirmation.lower() for word in negative_words)


class TestCopingStrategies:
    """Tests for coping strategies data."""

    def test_all_categories_exist(self):
        """Test that all expected categories are present."""
        expected_categories = ["anxiety", "depression", "stress", "general_wellness"]
        for category in expected_categories:
            assert category in COPING_STRATEGIES

    def test_each_category_has_strategies(self):
        """Test that each category has multiple strategies."""
        for category, strategies in COPING_STRATEGIES.items():
            assert isinstance(strategies, list)
            assert len(strategies) >= 3, f"{category} should have at least 3 strategies"


class TestAssessmentQuestions:
    """Tests for assessment questions data."""

    def test_questions_have_required_fields(self):
        """Test that all questions have required fields."""
        required_fields = ["id", "question", "type"]
        for question in ASSESSMENT_QUESTIONS:
            for field in required_fields:
                assert field in question, f"Question missing {field}"

    def test_scale_questions_have_min_max(self):
        """Test that scale type questions have min and max values."""
        for question in ASSESSMENT_QUESTIONS:
            if question["type"] == "scale":
                assert "min" in question
                assert "max" in question

    def test_choice_questions_have_options(self):
        """Test that choice type questions have options."""
        for question in ASSESSMENT_QUESTIONS:
            if question["type"] == "choice":
                assert "options" in question
                assert len(question["options"]) >= 2


class TestCrisisKeywords:
    """Tests for crisis keywords."""

    def test_crisis_keywords_exist(self):
        """Test that crisis keywords list is not empty."""
        assert len(CRISIS_KEYWORDS) > 0

    def test_crisis_keywords_are_lowercase(self):
        """Test that crisis keywords are in lowercase for matching."""
        for keyword in CRISIS_KEYWORDS:
            assert keyword == keyword.lower()
