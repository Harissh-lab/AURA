import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface UserEmergencyData {
  userId: string;
  fullName: string;
  mobileNumber: string;
  emergencyContact1?: EmergencyContact;
  emergencyContact2?: EmergencyContact;
}

/**
 * Save user emergency contact information to Firestore
 */
export async function saveUserEmergencyData(
  userId: string,
  data: {
    fullName: string;
    mobileNumber: string;
    emergencyContact1?: EmergencyContact;
    emergencyContact2?: EmergencyContact;
  }
): Promise<void> {
  try {
    console.log('💾 Saving emergency data to Firebase for user:', userId);
    console.log('📋 Data to save:', {
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      contact1: data.emergencyContact1 ? `${data.emergencyContact1.name} (${data.emergencyContact1.phone})` : 'None',
      contact2: data.emergencyContact2 ? `${data.emergencyContact2.name} (${data.emergencyContact2.phone})` : 'None'
    });
    
    const userDocRef = doc(db, 'users', userId);
    const saveData = {
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      emergencyContact1: data.emergencyContact1 || null,
      emergencyContact2: data.emergencyContact2 || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(userDocRef, saveData, { merge: true });
    
    console.log('✅ Emergency contact data SUCCESSFULLY saved to Firestore!');
    console.log('📍 Firebase path: users/' + userId);
  } catch (error) {
    console.error('❌ FIREBASE SAVE ERROR:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Get user emergency contact information from Firestore
 */
export async function getUserEmergencyData(userId: string): Promise<UserEmergencyData | null> {
  try {
    console.log('🔍 Fetching emergency data for user:', userId);
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    console.log('📄 Document exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('📦 Raw Firebase data:', JSON.stringify(data, null, 2));
      
      const userData = {
        userId,
        fullName: data.fullName || '',
        mobileNumber: data.mobileNumber || '',
        emergencyContact1: data.emergencyContact1 || undefined,
        emergencyContact2: data.emergencyContact2 || undefined
      };
      
      console.log('✅ Processed user data:', {
        fullName: userData.fullName,
        mobileNumber: userData.mobileNumber,
        hasContact1: !!userData.emergencyContact1,
        hasContact2: !!userData.emergencyContact2,
        contact1: userData.emergencyContact1 ? `${userData.emergencyContact1.name} (${userData.emergencyContact1.phone})` : 'None',
        contact2: userData.emergencyContact2 ? `${userData.emergencyContact2.name} (${userData.emergencyContact2.phone})` : 'None'
      });
      
      return userData;
    }
    
    console.warn('⚠️ No user document found in Firebase for user:', userId);
    return null;
  } catch (error) {
    console.error('❌ FIREBASE FETCH ERROR:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Trigger crisis alert - logs emergency event and prepares for notification
 */
export async function triggerCrisisAlert(
  userId: string,
  crisisMessage: string,
  detectionDetails: {
    confidence: number;
    probability: number;
  }
): Promise<{
  success: boolean;
  emergencyContacts: EmergencyContact[];
  crisisNumber: string;
}> {
  try {
    // Get user's emergency contacts
    const userData = await getUserEmergencyData(userId);
    
    if (!userData) {
      console.warn('⚠️ No user data found for crisis alert');
      return {
        success: false,
        emergencyContacts: [],
        crisisNumber: '14416'
      };
    }
    
    // Log crisis event to Firestore
    const crisisEventRef = collection(db, 'crisisEvents');
    await addDoc(crisisEventRef, {
      userId,
      userName: userData.fullName,
      userPhone: userData.mobileNumber,
      crisisMessage,
      detectionConfidence: detectionDetails.confidence,
      detectionProbability: detectionDetails.probability,
      timestamp: serverTimestamp(),
      status: 'detected',
      alertsSent: false
    });
    
    console.log('🚨 CRISIS DETECTED for user:', userData.fullName);
    console.log('📊 Detection confidence:', detectionDetails.confidence);
    console.log('📊 Detection probability:', detectionDetails.probability);
    
    // Collect emergency contacts
    const emergencyContacts: EmergencyContact[] = [];
    if (userData.emergencyContact1) {
      emergencyContacts.push(userData.emergencyContact1);
    }
    if (userData.emergencyContact2) {
      emergencyContacts.push(userData.emergencyContact2);
    }
    
    // Tele MANAS - India National Mental Health Helpline
    const crisisNumber = '14416';
    
    console.log('🚨 CRISIS ALERT TRIGGERED');
    console.log('👤 User:', userData.fullName, `(${userData.mobileNumber})`);
    console.log('📞 Emergency Contacts:', emergencyContacts.length);
    emergencyContacts.forEach((contact, index) => {
      console.log(`   ${index + 1}. ${contact.name} (${contact.relationship || 'Contact'}) - ${contact.phone}`);
    });
    console.log('🆘 Crisis Helpline:', crisisNumber);
    
    // In production, integrate with:
    // - Twilio for SMS alerts to emergency contacts
    // - Phone call API to auto-dial crisis helpline
    // - Email notification service
    
    return {
      success: true,
      emergencyContacts,
      crisisNumber
    };
    
  } catch (error) {
    console.error('❌ Error triggering crisis alert:', error);
    return {
      success: false,
      emergencyContacts: [],
      crisisNumber: '14416'
    };
  }
}

/**
 * Prepare emergency SMS message
 */
export function prepareEmergencySMS(userName: string, timestamp: Date): string {
  return `🚨 URGENT: ${userName} may need immediate mental health support. ` +
         `They triggered a crisis alert at ${timestamp.toLocaleString('en-IN')}. ` +
         `Please check on them immediately. Crisis Helpline: Tele MANAS 14416 or 1800-89-14416 (24/7, 20 languages)`;
}

/**
 * Format phone number for calling (tel: URI)
 */
export function getCallablePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with country code, keep it
  // Otherwise, assume India (+91)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `tel:+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return `tel:+91${cleaned}`;
  }
  return `tel:${cleaned}`;
}

/**
 * Initiate phone call to crisis helpline
 */
export function callCrisisHelpline(phoneNumber?: string): void {
  const crisisNumber = phoneNumber || '14416';
  window.location.href = `tel:${crisisNumber}`;
  console.log('📞 Initiating call to Crisis Helpline:', crisisNumber);
}

/**
 * Initiate phone call to emergency contact
 */
export function callEmergencyContact(contact: EmergencyContact): void {
  const phoneUri = getCallablePhoneNumber(contact.phone);
  window.location.href = phoneUri;
  console.log('📞 Initiating call to emergency contact:', contact.name, phoneUri);
}
