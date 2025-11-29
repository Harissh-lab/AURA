"""Mental health assessment and response module for AURA."""
import random

# Mental health questionnaire questions for assessment
ASSESSMENT_QUESTIONS = [
    {
        "id": 1,
        "question": "How would you rate your mood today on a scale of 1-10?",
        "type": "scale",
        "min": 1,
        "max": 10
    },
    {
        "id": 2,
        "question": "How well did you sleep last night?",
        "type": "choice",
        "options": ["Very Poor", "Poor", "Average", "Good", "Excellent"]
    },
    {
        "id": 3,
        "question": "Have you been feeling anxious or worried lately?",
        "type": "choice",
        "options": ["Not at all", "A little", "Moderately", "Quite a bit", "Extremely"]
    },
    {
        "id": 4,
        "question": "How often do you feel overwhelmed by your responsibilities?",
        "type": "choice",
        "options": ["Never", "Rarely", "Sometimes", "Often", "Always"]
    },
    {
        "id": 5,
        "question": "Have you lost interest in activities you used to enjoy?",
        "type": "choice",
        "options": ["Not at all", "A little", "Moderately", "Quite a bit", "Completely"]
    }
]

# Coping strategies based on mental health conditions
COPING_STRATEGIES = {
    "anxiety": [
        "Practice deep breathing exercises - inhale for 4 counts, hold for 4, exhale for 4",
        "Try grounding techniques - name 5 things you can see, 4 you can touch, 3 you can hear",
        "Take a short walk in nature to calm your mind",
        "Write down your worries and challenge negative thoughts",
        "Practice progressive muscle relaxation"
    ],
    "depression": [
        "Start with small, achievable goals each day",
        "Maintain a regular sleep schedule",
        "Connect with someone you trust - even a brief conversation helps",
        "Engage in light physical activity",
        "Practice gratitude by listing three things you're thankful for"
    ],
    "stress": [
        "Break large tasks into smaller, manageable steps",
        "Take regular breaks during work",
        "Practice mindfulness meditation for 5-10 minutes",
        "Limit caffeine and alcohol intake",
        "Create a relaxing bedtime routine"
    ],
    "general_wellness": [
        "Maintain a balanced diet and stay hydrated",
        "Get regular exercise - even 20 minutes a day helps",
        "Practice good sleep hygiene",
        "Stay connected with friends and family",
        "Take time for hobbies and activities you enjoy"
    ]
}

# Supportive responses based on emotional keywords
EMOTIONAL_RESPONSES = {
    "sad": {
        "response": "I'm sorry to hear you're feeling sad. It's okay to feel this way. "
                    "Would you like to talk about what's making you feel this way?",
        "strategies": COPING_STRATEGIES["depression"],
        "category": "depression"
    },
    "anxious": {
        "response": "I understand anxiety can be overwhelming. Let's take a moment "
                    "to breathe together. Remember, you're not alone in this.",
        "strategies": COPING_STRATEGIES["anxiety"],
        "category": "anxiety"
    },
    "stressed": {
        "response": "Stress can feel like a heavy burden. Let's work together to "
                    "find ways to lighten that load.",
        "strategies": COPING_STRATEGIES["stress"],
        "category": "stress"
    },
    "depressed": {
        "response": "I hear you, and I want you to know that your feelings are valid. "
                    "Even small steps forward can make a difference.",
        "strategies": COPING_STRATEGIES["depression"],
        "category": "depression"
    },
    "worried": {
        "response": "Worry can consume our thoughts. Let's try to focus on what "
                    "you can control right now.",
        "strategies": COPING_STRATEGIES["anxiety"],
        "category": "anxiety"
    },
    "overwhelmed": {
        "response": "It's okay to feel overwhelmed. Let's break things down "
                    "into smaller, manageable pieces.",
        "strategies": COPING_STRATEGIES["stress"],
        "category": "stress"
    },
    "lonely": {
        "response": "Loneliness can be incredibly difficult. Remember, reaching "
                    "out - even to me - is a positive step.",
        "strategies": COPING_STRATEGIES["depression"],
        "category": "depression"
    },
    "hopeless": {
        "response": "I'm here for you. When things feel hopeless, please know "
                    "that feelings are temporary and help is available.",
        "strategies": COPING_STRATEGIES["depression"],
        "category": "depression"
    },
    "happy": {
        "response": "That's wonderful to hear! It's great that you're feeling "
                    "positive. What's contributing to your happiness?",
        "strategies": COPING_STRATEGIES["general_wellness"],
        "category": "general_wellness"
    },
    "good": {
        "response": "I'm glad you're feeling good! Let's keep that momentum "
                    "going with some positive activities.",
        "strategies": COPING_STRATEGIES["general_wellness"],
        "category": "general_wellness"
    },
    "angry": {
        "response": "Anger is a natural emotion. Let's find healthy ways to "
                    "express and process what you're feeling.",
        "strategies": COPING_STRATEGIES["stress"],
        "category": "stress"
    },
    "scared": {
        "response": "Fear can be paralyzing. You're brave for sharing this. "
                    "Let's work through this together.",
        "strategies": COPING_STRATEGIES["anxiety"],
        "category": "anxiety"
    },
    "tired": {
        "response": "Fatigue affects both our mental and physical well-being. "
                    "Let's explore what might be draining your energy.",
        "strategies": COPING_STRATEGIES["general_wellness"],
        "category": "general_wellness"
    }
}

# Crisis keywords that trigger urgent response
CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "don't want to live",
    "hurt myself", "self harm", "cutting", "no reason to live"
]

CRISIS_RESPONSE = """
I'm very concerned about what you've shared. Please know that you matter and 
there is help available right now.

🆘 IMMEDIATE HELP:
• National Suicide Prevention Lifeline: 988 (US)
• Crisis Text Line: Text HOME to 741741
• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

Please reach out to one of these resources or go to your nearest emergency room.
You don't have to face this alone.
"""


def detect_emotional_state(message):
    """
    Analyze the user's message to detect emotional state.

    Args:
        message: User's text input

    Returns:
        dict: Contains detected emotion, response, and strategies
    """
    message_lower = message.lower()

    # Check for crisis keywords first
    for keyword in CRISIS_KEYWORDS:
        if keyword in message_lower:
            return {
                "is_crisis": True,
                "response": CRISIS_RESPONSE,
                "strategies": [],
                "category": "crisis"
            }

    # Check for emotional keywords
    for emotion, data in EMOTIONAL_RESPONSES.items():
        if emotion in message_lower:
            return {
                "is_crisis": False,
                "emotion": emotion,
                "response": data["response"],
                "strategies": data["strategies"],
                "category": data["category"]
            }

    # Default supportive response
    return {
        "is_crisis": False,
        "emotion": "neutral",
        "response": "Thank you for sharing. I'm here to listen and support you. "
                    "How are you feeling today? You can tell me about any emotions "
                    "you're experiencing.",
        "strategies": COPING_STRATEGIES["general_wellness"],
        "category": "general_wellness"
    }


def analyze_assessment(responses):
    """
    Analyze assessment responses to determine mental health status.

    Args:
        responses: dict of question IDs to user responses

    Returns:
        dict: Analysis results with recommendations
    """
    score = 0
    max_score = 100

    # Calculate scores based on responses
    if "1" in responses:
        mood_score = int(responses["1"])
        score += mood_score * 3  # Weight: 30 points max

    sleep_weights = {"Very Poor": 0, "Poor": 5, "Average": 10, "Good": 15, "Excellent": 20}
    if "2" in responses and responses["2"] in sleep_weights:
        score += sleep_weights[responses["2"]]

    anxiety_weights = {"Not at all": 20, "A little": 15, "Moderately": 10, "Quite a bit": 5, "Extremely": 0}
    if "3" in responses and responses["3"] in anxiety_weights:
        score += anxiety_weights[responses["3"]]

    overwhelm_weights = {"Never": 15, "Rarely": 12, "Sometimes": 9, "Often": 5, "Always": 0}
    if "4" in responses and responses["4"] in overwhelm_weights:
        score += overwhelm_weights[responses["4"]]

    interest_weights = {"Not at all": 15, "A little": 12, "Moderately": 9, "Quite a bit": 5, "Completely": 0}
    if "5" in responses and responses["5"] in interest_weights:
        score += interest_weights[responses["5"]]

    # Determine mental health status based on score
    if score >= 80:
        status = "excellent"
        message = "Your mental health appears to be in a good place! Keep up the healthy habits."
        strategies = COPING_STRATEGIES["general_wellness"]
    elif score >= 60:
        status = "good"
        message = "You're doing well overall. Here are some tips to maintain your mental wellness."
        strategies = COPING_STRATEGIES["general_wellness"]
    elif score >= 40:
        status = "moderate"
        message = "You may be experiencing some stress or mild difficulties. Here are some coping strategies."
        strategies = COPING_STRATEGIES["stress"]
    elif score >= 20:
        status = "concerning"
        message = "It seems like you might be going through a challenging time. Please consider these resources."
        strategies = COPING_STRATEGIES["anxiety"] + COPING_STRATEGIES["depression"][:2]
    else:
        status = "needs_attention"
        message = "I'm concerned about your well-being. Please reach out to a mental health professional."
        strategies = COPING_STRATEGIES["depression"]

    return {
        "score": score,
        "max_score": max_score,
        "status": status,
        "message": message,
        "strategies": strategies
    }


def get_daily_affirmation():
    """Return a daily affirmation for positive mental health."""
    affirmations = [
        "You are worthy of love and kindness.",
        "Every day is a new opportunity for growth.",
        "Your feelings are valid and important.",
        "You have the strength to overcome challenges.",
        "It's okay to take things one step at a time.",
        "You are not alone in your journey.",
        "Small progress is still progress.",
        "You deserve peace and happiness.",
        "Your best is always good enough.",
        "Today, you choose to be gentle with yourself."
    ]
    return random.choice(affirmations)
