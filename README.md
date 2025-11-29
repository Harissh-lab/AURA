# 🌟 AURA - Mental Health Support Application

AURA (Awareness, Understanding, Recovery, Assistance) is a compassionate mental health support application designed to help users understand and manage their mental well-being.

## Features

- **💬 Supportive Chat**: Talk to AURA about your feelings and receive empathetic, supportive responses with coping strategies
- **📋 Mental Health Assessment**: Take a quick assessment to understand your current mental state
- **📚 Coping Resources**: Access a library of evidence-based coping strategies for anxiety, depression, stress, and general wellness
- **✨ Daily Affirmations**: Start your day with positive, uplifting affirmations
- **🆘 Crisis Support**: Immediate access to emergency mental health resources

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Harissh-lab/AURA.git
cd AURA
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python run.py
```

5. Open your browser and navigate to `http://localhost:5000`

## Usage

### Chat Feature
Simply type how you're feeling in the chat box. AURA will:
- Recognize emotional keywords in your message
- Provide supportive, empathetic responses
- Suggest relevant coping strategies
- Detect crisis situations and provide immediate resources

### Mental Health Assessment
- Navigate to the Assessment page
- Answer 5 questions about your current mental state
- Receive a personalized score and recommendations
- Get targeted coping strategies based on your results

### Resources
- Browse coping strategies organized by category:
  - Anxiety management
  - Depression support
  - Stress relief
  - General wellness
- Access emergency contact information

## Important Disclaimer

⚠️ **AURA is not a replacement for professional mental health care.** This application is designed to provide supportive responses and general coping strategies. If you are experiencing a mental health crisis or need professional help, please:

- Contact a licensed mental health professional
- Call the National Suicide Prevention Lifeline: **988** (US)
- Text HOME to **741741** for the Crisis Text Line
- Visit your nearest emergency room

## Project Structure

```
AURA/
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── routes.py             # Application routes
│   └── mental_health.py      # Mental health logic and data
├── templates/
│   ├── index.html            # Home page
│   ├── assessment.html       # Assessment page
│   └── resources.html        # Resources page
├── static/
│   ├── css/
│   │   └── style.css         # Application styles
│   └── js/
│       └── app.js            # Frontend JavaScript
├── tests/
│   └── test_mental_health.py # Unit tests
├── requirements.txt          # Python dependencies
├── run.py                    # Application entry point
└── README.md                 # This file
```

## Technology Stack

- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **Styling**: Custom CSS with responsive design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License