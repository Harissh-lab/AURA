// Crisis Detection Utility
// Detects potentially dangerous or suicidal language in user messages

const CRISIS_KEYWORDS = {
    suicidal: [
        'kill myself',
        'want to die',
        'end my life',
        'suicide',
        'suicidal',
        'not worth living',
        'better off dead',
        'end it all',
        'take my life',
        'don\'t want to live',
        'can\'t go on',
        'want to disappear',
        'no reason to live',
        'goodbye forever',
        'final goodbye'
    ],
    homicidal: [
        'kill someone',
        'kill them',
        'going to hurt',
        'shoot someone',
        'stab someone',
        'murder',
        'going to kill',
        'hurt someone badly',
        'make them pay',
        'end their life'
    ],
    selfHarm: [
        'hurt myself',
        'cut myself',
        'harm myself',
        'self harm',
        'self-harm',
        'cutting',
        'burning myself',
        'overdose',
        'take all the pills'
    ],
    immediateRisk: [
        'right now',
        'tonight',
        'today',
        'doing it',
        'have a plan',
        'wrote a note',
        'saying goodbye',
        'last time',
        'can\'t take it anymore'
    ]
};

/**
 * Analyzes text for crisis indicators
 * @param {string} text - The user's message
 * @returns {object} - { isCrisis: boolean, severity: 'none'|'low'|'high', matchedKeywords: string[] }
 */
export const detectCrisis = (text) => {
    if (!text || typeof text !== 'string') {
        return { isCrisis: false, severity: 'none', matchedKeywords: [] };
    }

    const lowerText = text.toLowerCase();
    const matchedKeywords = [];
    let highSeverityCount = 0;

    // Check suicidal language (high severity)
    CRISIS_KEYWORDS.suicidal.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            matchedKeywords.push(keyword);
            highSeverityCount++;
        }
    });

    // Check homicidal language (high severity)
    CRISIS_KEYWORDS.homicidal.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            matchedKeywords.push(keyword);
            highSeverityCount++;
        }
    });

    // Check self-harm language
    CRISIS_KEYWORDS.selfHarm.forEach(keyword => {
        if (lowerText.includes(keyword)) {
            matchedKeywords.push(keyword);
        }
    });

    // Check immediate risk indicators (escalates severity)
    const hasImmediateRisk = CRISIS_KEYWORDS.immediateRisk.some(keyword => 
        lowerText.includes(keyword)
    );

    // Determine crisis level
    if (highSeverityCount > 0 || (matchedKeywords.length > 0 && hasImmediateRisk)) {
        return {
            isCrisis: true,
            severity: 'high',
            matchedKeywords,
            hasImmediateRisk
        };
    } else if (matchedKeywords.length > 0) {
        return {
            isCrisis: true,
            severity: 'low',
            matchedKeywords,
            hasImmediateRisk: false
        };
    }

    return {
        isCrisis: false,
        severity: 'none',
        matchedKeywords: [],
        hasImmediateRisk: false
    };
};

/**
 * Formats the crisis detection for logging/debugging
 * @param {object} detection - Result from detectCrisis
 * @returns {string}
 */
export const formatCrisisDetection = (detection) => {
    if (!detection.isCrisis) return 'No crisis detected';
    return `CRISIS DETECTED - Severity: ${detection.severity.toUpperCase()}, Keywords: ${detection.matchedKeywords.join(', ')}`;
};
