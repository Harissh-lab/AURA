// Emergency Contact Service
// Handles sending emergency alerts to designated contacts

/**
 * Sends an emergency SMS to the user's emergency contact
 * @param {object} params - Emergency alert parameters
 * @param {string} params.contactNumber - Emergency contact phone number
 * @param {string} params.userName - User's name
 * @param {string} params.userCondition - Current user condition/state
 * @param {string} params.location - User's location (if available)
 * @returns {Promise<object>} - Result of the SMS send operation
 */
export const sendEmergencyAlert = async ({ 
    contactNumber, 
    userName = 'Your contact', 
    userCondition = 'in crisis',
    location = 'Unknown location'
}) => {
    const timestamp = new Date().toLocaleString();
    
    const message = `
🚨 EMERGENCY ALERT 🚨

${userName} may need immediate help.

Current Status: ${userCondition}
Location: ${location}
Time: ${timestamp}

They have activated emergency crisis support through Aura mental health app and may be in danger. Please check on them immediately.

Crisis Resources:
• Call 988 (Suicide & Crisis Lifeline)
• Text HOME to 741741 (Crisis Text Line)
• Call 911 for immediate danger

This is an automated alert from Aura app.
    `.trim();

    try {
        // In a real application, this would integrate with:
        // - Twilio API for SMS
        // - User's emergency contacts from profile settings
        // - Geolocation services
        
        console.log('📱 EMERGENCY SMS WOULD BE SENT:');
        console.log('To:', contactNumber);
        console.log('Message:', message);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For demonstration, we'll store in localStorage
        const alertData = {
            contactNumber,
            userName,
            userCondition,
            location,
            timestamp,
            message,
            status: 'sent'
        };

        // Store alert history
        const alerts = JSON.parse(localStorage.getItem('emergencyAlerts') || '[]');
        alerts.push(alertData);
        localStorage.setItem('emergencyAlerts', JSON.stringify(alerts));

        return {
            success: true,
            message: 'Emergency alert sent successfully',
            data: alertData
        };

    } catch (error) {
        console.error('Error sending emergency alert:', error);
        return {
            success: false,
            message: 'Failed to send emergency alert',
            error: error.message
        };
    }
};

/**
 * Gets emergency contact from user profile
 * In production, this would fetch from user settings
 */
export const getEmergencyContact = () => {
    // Try to get from localStorage (user settings)
    const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    return {
        name: userSettings.emergencyContactName || 'Emergency Contact',
        number: userSettings.emergencyContactNumber || '+1-XXX-XXX-XXXX',
        relationship: userSettings.emergencyContactRelationship || 'Family/Friend'
    };
};

/**
 * Saves emergency contact information
 */
export const saveEmergencyContact = (contactInfo) => {
    const userSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    userSettings.emergencyContactName = contactInfo.name;
    userSettings.emergencyContactNumber = contactInfo.number;
    userSettings.emergencyContactRelationship = contactInfo.relationship;
    
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    
    return { success: true };
};

/**
 * Gets user's current condition through a dialog
 */
export const getUserCondition = () => {
    return new Promise((resolve) => {
        const condition = prompt(
            'Please briefly describe your current condition or what you\'re experiencing:',
            'I need immediate help'
        );
        resolve(condition || 'User declined to describe condition');
    });
};

/**
 * Attempts to get user's location
 */
export const getUserLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve('Location not available');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
            },
            (error) => {
                console.error('Location error:', error);
                resolve('Location unavailable');
            },
            { timeout: 5000 }
        );
    });
};
