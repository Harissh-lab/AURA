import React from 'react';
import { Heart, Brain, Moon, Coffee } from 'lucide-react';

export const SUGGESTIONS = [
    { icon: <Heart size={20} />, text: "I'm feeling anxious right now", color: "bg-rose-100 text-rose-600" },
    { icon: <Brain size={20} />, text: "Guide me through a meditation", color: "bg-teal-100 text-teal-600" },
    { icon: <Moon size={20} />, text: "Tips for better sleep hygiene", color: "bg-indigo-100 text-indigo-600" },
    { icon: <Coffee size={20} />, text: "I just need to vent about work", color: "bg-amber-100 text-amber-600" },
];

export const MOCK_RESPONSE = "I hear you, and I'm here to support you. That sounds really challenging. Can you tell me a little more about what's on your mind? We can take this one step at a time.";
