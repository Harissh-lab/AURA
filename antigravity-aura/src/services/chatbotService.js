const API_BASE_URL = 'http://localhost:5000/api';

class ChatbotService {
  async sendMessage(message, mode = 'friend') {
    console.log('Sending message to API:', { message, mode, url: `${API_BASE_URL}/chat` });
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          mode
        }),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API error response:', errorData);
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response:', data);
      
      // Return response with ML distress detection info
      return {
        text: data.response,
        distressDetection: data.distress_detection || null,
        source: data.source || 'unknown'
      };
    } catch (error) {
      console.error('Chatbot service error:', error);
      return {
        text: "I'm having trouble connecting right now. Please try again.",
        distressDetection: null,
        source: 'error'
      };
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', model_loaded: false };
    }
  }

  async getModes() {
    try {
      const response = await fetch(`${API_BASE_URL}/modes`);
      const data = await response.json();
      return data.modes;
    } catch (error) {
      console.error('Failed to fetch modes:', error);
      return [];
    }
  }
}

export default new ChatbotService();
