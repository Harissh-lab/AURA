const API_BASE_URL = 'http://127.0.0.1:5000/api';

export interface ChatMessage {
  message: string;
  mode?: 'friend' | 'professional';
  useAI?: boolean;
  language?: string; // Language code for response
}

export interface ChatResponse {
  response: string;
  mode: string;
  source: string;
  distress_detection?: {
    is_distress: boolean;
    confidence: number;
    distress_probability: number;
    requires_crisis_intervention: boolean;
  };
}

export async function sendMessage(
  message: string, 
  mode: 'friend' | 'professional' = 'friend',
  language: string = 'en-US'
): Promise<ChatResponse> {
  console.log('🔵 Sending message to backend:', {
    message,
    mode,
    useAI: true,
    language
  });

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        mode,
        useAI: true,  // CRITICAL: ensures Gemma-3-27b is used
        language      // Send language to backend
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    
    console.log('🟢 Response from backend:', {
      source: data.source,
      response: data.response,
      distress: data.distress_detection
    });

    return data;
  } catch (error) {
    console.error('🔴 Error calling backend:', error);
    throw error;
  }
}
