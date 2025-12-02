// AURA Mental Health Application - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize chat functionality
    initializeChat();
    
    // Initialize assessment functionality
    initializeAssessment();
});

// Chat functionality
function initializeChat() {
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }
}

async function handleChatSubmit(event) {
    event.preventDefault();
    
    const input = document.getElementById('user-input');
    const messagesContainer = document.getElementById('chat-messages');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    input.value = '';
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        if (data.is_crisis) {
            addMessage(data.response, 'crisis');
        } else {
            addMessage(data.response, 'bot');
            
            // If there are strategies, show them
            if (data.strategies && data.strategies.length > 0) {
                addStrategiesMessage(data.strategies);
            }
        }
    } catch (error) {
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessage(text, type) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    
    if (type === 'user') {
        messageDiv.className = 'message user-message';
    } else if (type === 'crisis') {
        messageDiv.className = 'message bot-message crisis-message';
    } else {
        messageDiv.className = 'message bot-message';
    }
    
    messageDiv.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    messagesContainer.appendChild(messageDiv);
}

function addStrategiesMessage(strategies) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message strategies-message';
    
    let strategiesHtml = '<h4>💡 Here are some strategies that might help:</h4><ul>';
    strategies.forEach(strategy => {
        strategiesHtml += `<li>${strategy}</li>`;
    });
    strategiesHtml += '</ul>';
    
    messageDiv.innerHTML = strategiesHtml;
    messagesContainer.appendChild(messageDiv);
}

// Affirmation refresh
async function refreshAffirmation() {
    try {
        const response = await fetch('/api/affirmation');
        const data = await response.json();
        document.getElementById('affirmation').textContent = data.affirmation;
    } catch (error) {
        console.error('Error fetching affirmation:', error);
    }
}

// Assessment functionality
function initializeAssessment() {
    const assessmentForm = document.getElementById('assessment-form');
    if (assessmentForm) {
        assessmentForm.addEventListener('submit', handleAssessmentSubmit);
    }
}

function updateScaleValue(slider) {
    const valueDisplay = document.getElementById('value-' + slider.name);
    if (valueDisplay) {
        valueDisplay.textContent = slider.value;
    }
}

async function handleAssessmentSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const responses = {};
    
    for (let [key, value] of formData.entries()) {
        responses[key] = value;
    }
    
    try {
        const response = await fetch('/assessment/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(responses)
        });
        
        const results = await response.json();
        displayResults(results);
    } catch (error) {
        console.error('Error submitting assessment:', error);
        alert('Sorry, there was an error submitting your assessment. Please try again.');
    }
}

function displayResults(results) {
    // Hide assessment form
    document.getElementById('assessment-container').style.display = 'none';
    
    // Show results
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'block';
    
    // Update score
    document.getElementById('score-value').textContent = results.score;
    
    // Update status badge
    const statusBadge = document.getElementById('status-badge');
    statusBadge.textContent = results.status.replace('_', ' ').toUpperCase();
    statusBadge.className = 'status-badge ' + results.status;
    
    // Update message
    document.getElementById('results-message').textContent = results.message;
    
    // Update strategies
    const strategiesList = document.getElementById('strategies-list');
    strategiesList.innerHTML = '';
    results.strategies.forEach(strategy => {
        const li = document.createElement('li');
        li.textContent = strategy;
        strategiesList.appendChild(li);
    });
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function retakeAssessment() {
    // Reset form
    document.getElementById('assessment-form').reset();
    
    // Reset scale values display
    const scaleValues = document.querySelectorAll('.scale-value');
    scaleValues.forEach(sv => {
        sv.textContent = '5';
    });
    
    // Show assessment, hide results
    document.getElementById('assessment-container').style.display = 'block';
    document.getElementById('results-container').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
