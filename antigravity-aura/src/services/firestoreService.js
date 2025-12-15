import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// User Profile Management
export const createUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Chat History Management
export const saveChatMessage = async (userId, message, role) => {
  try {
    const chatRef = collection(db, 'users', userId, 'chatHistory');
    await addDoc(chatRef, {
      message,
      role,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving chat message:', error);
    return { success: false, error: error.message };
  }
};

export const getChatHistory = async (userId, limitCount = 50) => {
  try {
    const chatRef = collection(db, 'users', userId, 'chatHistory');
    const q = query(chatRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: messages.reverse() };
  } catch (error) {
    console.error('Error getting chat history:', error);
    return { success: false, error: error.message };
  }
};

export const clearChatHistory = async (userId) => {
  try {
    const chatRef = collection(db, 'users', userId, 'chatHistory');
    const querySnapshot = await getDocs(chatRef);
    
    const deletePromises = [];
    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, 'users', userId, 'chatHistory', document.id)));
    });
    
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return { success: false, error: error.message };
  }
};

// Emergency Contact Management
export const saveEmergencyContact = async (userId, contactData) => {
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'emergency'), {
      ...contactData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving emergency contact:', error);
    return { success: false, error: error.message };
  }
};

export const getEmergencyContact = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'emergency');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'No emergency contact found' };
    }
  } catch (error) {
    console.error('Error getting emergency contact:', error);
    return { success: false, error: error.message };
  }
};

// Crisis Alert Logs
export const logCrisisAlert = async (userId, alertData) => {
  try {
    const alertRef = collection(db, 'users', userId, 'crisisAlerts');
    await addDoc(alertRef, {
      ...alertData,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging crisis alert:', error);
    return { success: false, error: error.message };
  }
};

export const getCrisisAlerts = async (userId) => {
  try {
    const alertRef = collection(db, 'users', userId, 'crisisAlerts');
    const q = query(alertRef, orderBy('timestamp', 'desc'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const alerts = [];
    querySnapshot.forEach((doc) => {
      alerts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: alerts };
  } catch (error) {
    console.error('Error getting crisis alerts:', error);
    return { success: false, error: error.message };
  }
};
