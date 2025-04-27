
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser,
  sendEmailVerification
} from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc, query, where, orderBy, limit, Timestamp, serverTimestamp, enableIndexedDbPersistence, writeBatch, doc } from "firebase/firestore";
import { apiRequest } from "./queryClient";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
  app = initializeApp(firebaseConfig);
}
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence (helpful for better performance and offline support)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firebase persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required for persistence
    console.warn('Firebase persistence not supported by this browser');
  }
});

// Register user with email and password
export const registerWithEmailAndPassword = async (
  username: string,
  email: string, 
  password: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user in our backend
    await apiRequest("POST", "/api/users", {
      username,
      email,
      password: "firebase-auth", // We don't store the actual password
      firebaseId: user.uid
    });
    
    return user;
  } catch (error: any) {
    console.error("Error registering with email and password:", error);
    throw error;
  }
};

// Login with email and password
export const loginWithEmailAndPassword = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error logging in with email and password:", error);
    throw error;
  }
};

// Login with Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create user in our backend if they don't exist
    try {
      await apiRequest("POST", "/api/users", {
        username: user.displayName || user.email?.split('@')[0] || 'user',
        email: user.email || '',
        password: "firebase-auth", // We don't store the actual password
        firebaseId: user.uid
      });
    } catch (error) {
      // User might already exist, which is fine
      console.log("User might already exist in the backend", error);
    }
    
    return user;
  } catch (error: any) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error logging out:", error);
    throw error;
  }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore college cutoffs functions
export interface FirebaseCollegeCutoff {
  id?: string;
  university: string;
  program: string;
  country: string;
  gpa: string;
  testScores: string;
  acceptanceRate: string;
  academicYear: string;
}

// Fetch college cutoffs from Firestore
export const getCollegeCutoffs = async (filters?: Partial<FirebaseCollegeCutoff>): Promise<FirebaseCollegeCutoff[]> => {
  try {
    const cutoffsCollectionRef = collection(db, "collegeCutoffs");
    let queryRef = query(cutoffsCollectionRef);
    
    // Apply filters if they exist
    if (filters) {
      if (filters.university) {
        queryRef = query(queryRef, where("university", "==", filters.university));
      }
      if (filters.program) {
        queryRef = query(queryRef, where("program", "==", filters.program));
      }
      if (filters.country) {
        queryRef = query(queryRef, where("country", "==", filters.country));
      }
      if (filters.academicYear) {
        queryRef = query(queryRef, where("academicYear", "==", filters.academicYear));
      }
    }
    
    const querySnapshot = await getDocs(queryRef);
    const cutoffs: FirebaseCollegeCutoff[] = [];
    
    querySnapshot.forEach((doc) => {
      cutoffs.push({
        id: doc.id,
        ...doc.data() as Omit<FirebaseCollegeCutoff, 'id'>
      });
    });
    
    return cutoffs;
  } catch (error) {
    console.error("Error fetching college cutoffs from Firebase:", error);
    throw error;
  }
};

// Get unique programs from Firestore
export const getUniquePrograms = async (): Promise<string[]> => {
  try {
    const cutoffsCollectionRef = collection(db, "collegeCutoffs");
    const querySnapshot = await getDocs(cutoffsCollectionRef);
    const programs = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.program) {
        programs.add(data.program);
      }
    });
    
    return Array.from(programs).sort();
  } catch (error) {
    console.error("Error fetching unique programs from Firebase:", error);
    throw error;
  }
};

// Get unique universities from Firestore
export const getUniqueUniversities = async (): Promise<string[]> => {
  try {
    const cutoffsCollectionRef = collection(db, "collegeCutoffs");
    const querySnapshot = await getDocs(cutoffsCollectionRef);
    const universities = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.university) {
        universities.add(data.university);
      }
    });
    
    return Array.from(universities).sort();
  } catch (error) {
    console.error("Error fetching unique universities from Firebase:", error);
    throw error;
  }
};

// Get unique countries from Firestore
export const getUniqueCountries = async (): Promise<string[]> => {
  try {
    const cutoffsCollectionRef = collection(db, "collegeCutoffs");
    const querySnapshot = await getDocs(cutoffsCollectionRef);
    const countries = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.country) {
        countries.add(data.country);
      }
    });
    
    return Array.from(countries).sort();
  } catch (error) {
    console.error("Error fetching unique countries from Firebase:", error);
    throw error;
  }
};

// Chat message interface
export interface FirebaseChatMessage {
  id?: string;
  content: string;
  isUserMessage: boolean;
  userId: string;
  timestamp: any;
}

// Save chat message to Firebase
export const saveChatMessage = async (message: Omit<FirebaseChatMessage, 'id' | 'timestamp'>): Promise<FirebaseChatMessage> => {
  try {
    const chatMessagesRef = collection(db, "chatMessages");
    
    const messageData = {
      ...message,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(chatMessagesRef, messageData);
    
    return {
      id: docRef.id,
      ...messageData,
    };
  } catch (error) {
    console.error("Error saving chat message to Firebase:", error);
    throw error;
  }
};

// Get chat messages from Firebase for a specific user
export const getChatMessages = async (userId: string): Promise<FirebaseChatMessage[]> => {
  try {
    const chatMessagesRef = collection(db, "chatMessages");
    
    // Try to use a composite query with ordering
    try {
      const q = query(
        chatMessagesRef, 
        where("userId", "==", userId),
        orderBy("timestamp", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const messages: FirebaseChatMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firebase Timestamp to Date if it exists
        let messageDate: Date;
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          messageDate = data.timestamp.toDate();
        } else if (data.timestamp && data.timestamp.seconds) {
          // Handle Firestore timestamp that might be serialized
          messageDate = new Date(data.timestamp.seconds * 1000);
        } else {
          // Fallback to current date if no timestamp
          messageDate = new Date();
        }

        messages.push({
          id: doc.id,
          content: data.content,
          isUserMessage: data.isUserMessage,
          userId: data.userId,
          timestamp: messageDate,
        });
      });
      
      return messages;
    } catch (indexError) {
      // If we get a failed-precondition error, it likely means we need an index
      // For now, let's try a simpler query without ordering
      console.warn("Composite query failed, trying simpler query", indexError);
      
      const simpleQuery = query(
        chatMessagesRef, 
        where("userId", "==", userId)
      );
      
      const querySnapshot = await getDocs(simpleQuery);
      const messages: FirebaseChatMessage[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firebase Timestamp to Date if it exists
        let messageDate: Date;
        if (data.timestamp && typeof data.timestamp.toDate === 'function') {
          messageDate = data.timestamp.toDate();
        } else if (data.timestamp && data.timestamp.seconds) {
          // Handle Firestore timestamp that might be serialized
          messageDate = new Date(data.timestamp.seconds * 1000);
        } else {
          // Fallback to current date if no timestamp
          messageDate = new Date();
        }
        
        messages.push({
          id: doc.id,
          content: data.content,
          isUserMessage: data.isUserMessage,
          userId: data.userId,
          timestamp: messageDate,
        });
      });
      
      // Sort messages by timestamp client-side
      messages.sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 0;
        return timeA - timeB;
      });
      
      return messages;
    }
  } catch (error) {
    console.error("Error fetching chat messages from Firebase:", error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (user: FirebaseUser, profileData: { displayName?: string, photoURL?: string }) => {
  try {
    await firebaseUpdateProfile(user, profileData);
    return user;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Gujarat College interface
export interface FirebaseCollege {
  id?: string;
  name: string;
  location: string;
  district: string;
  type: string;  // "Government", "Private", "Aided", etc.
  website?: string;
  contactInfo?: string;
  courses?: string[];
  description?: string;
  imageUrl?: string;
}

// Add a new college to Firestore
export const addCollege = async (college: Omit<FirebaseCollege, 'id'>): Promise<FirebaseCollege> => {
  try {
    const collegesRef = collection(db, "colleges");
    const docRef = await addDoc(collegesRef, college);
    
    return {
      id: docRef.id,
      ...college
    };
  } catch (error) {
    console.error("Error adding college to Firebase:", error);
    throw error;
  }
};

// Get colleges from Firestore with optional district filter
export const getColleges = async (district?: string): Promise<FirebaseCollege[]> => {
  try {
    const collegesRef = collection(db, "colleges");
    let queryRef = query(collegesRef);
    
    // Apply district filter if provided
    if (district && district !== "all") {
      queryRef = query(queryRef, where("district", "==", district));
    }
    
    const querySnapshot = await getDocs(queryRef);
    const colleges: FirebaseCollege[] = [];
    
    querySnapshot.forEach((doc) => {
      colleges.push({
        id: doc.id,
        ...doc.data() as Omit<FirebaseCollege, 'id'>
      });
    });
    
    return colleges;
  } catch (error) {
    console.error("Error fetching colleges from Firebase:", error);
    throw error;
  }
};

// Get unique districts from Firestore colleges collection
export const getUniqueDistricts = async (): Promise<string[]> => {
  try {
    const collegesRef = collection(db, "colleges");
    const querySnapshot = await getDocs(collegesRef);
    const districts = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.district) {
        districts.add(data.district);
      }
    });
    
    return Array.from(districts).sort();
  } catch (error) {
    console.error("Error fetching unique districts from Firebase:", error);
    throw error;
  }
};

// Function to add multiple colleges at once (for admin use)
export const addMultipleColleges = async (colleges: Omit<FirebaseCollege, 'id'>[]): Promise<number> => {
  try {
    const collegesRef = collection(db, "colleges");
    let addedCount = 0;
    
    // Using a batch write for better performance with multiple documents
    const batch = writeBatch(db);
    
    colleges.forEach((college) => {
      const docRef = doc(collegesRef);
      batch.set(docRef, college);
      addedCount++;
    });
    
    await batch.commit();
    return addedCount;
  } catch (error) {
    console.error("Error adding multiple colleges to Firebase:", error);
    throw error;
  }
};

export { auth, db };
