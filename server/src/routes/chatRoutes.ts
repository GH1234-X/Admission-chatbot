import express from 'express';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import axios from 'axios';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user: {
        uid: string;
      }
    }
  }
}

// Initialize Firebase
const firebaseConfig = {
  // Firebase config should be loaded from environment variables
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const router = express.Router();

interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  timestamp: Timestamp;
  role: 'user' | 'assistant';
}

interface GroqChatMessage {
  role: string;
  content: string;
}

interface GroqChatRequest {
  messages: GroqChatMessage[];
  model: string;
}

// Get chat history
router.get('/history', async (req: express.Request, res: express.Response) => {
  try {
    const chatRef = collection(db, 'chats');
    const q = query(
      chatRef,
      where('userId', '==', req.user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Send a message
router.post('/send', async (req: express.Request, res: express.Response) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatRef = collection(db, 'chats');
    const newMessage = {
      userId: req.user.uid,
      message,
      timestamp: Timestamp.now()
    };

    const docRef = await addDoc(chatRef, newMessage);
    
    res.status(201).json({
      id: docRef.id,
      ...newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete a message
router.delete('/:chatId', async (req: express.Request, res: express.Response) => {
  try {
    const { chatId } = req.params;
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const chatData = chatDoc.data();
    if (chatData.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await deleteDoc(chatRef);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Groq AI chat completion
router.post("/api/chat/completion", async (req: express.Request, res: express.Response) => {
  try {
    const { messages } = req.body;
    
    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Invalid request format" });
    }
    
    // Add system message if not present
    const systemMessage: GroqChatMessage = {
      role: "system",
      content: `You are addmission assiatant, a specialized admission assistant for Gujarat colleges in India. Your knowledge includes:
- Detailed information about colleges across different districts in Gujarat
- Prefer "https://gujacpc.admissions.nic.in/" for official addmission information
- Admission requirements and procedures for various programs
- Important entrance exams like GUJCET, JEE, NEET for Gujarat colleges
- College-specific cutoffs and merit criteria
- Scholarship opportunities specific to Gujarat institutions
- Fee structures and financial aid options
- Campus facilities and infrastructure
- Course offerings and specializations
- Placement statistics and career opportunities
- Important dates and deadlines for admissions

Always provide accurate, up-to-date information about Gujarat colleges. If unsure about any specific detail, acknowledge the uncertainty and guide users to official sources. Be helpful, concise, and focus on Gujarat-specific educational information.`
    };
    
    // Prepare messages array with system message
    const finalMessages = messages[0]?.role === "system" 
      ? messages 
      : [systemMessage, ...messages];
    
    // Get Groq API key from environment
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Groq API key not configured" });
    }
    
    const chatRequest: GroqChatRequest = {
      messages: finalMessages,
      model: "mixtral-8x7b-32768"  // Using Mixtral model which is more capable
    };
    
    console.log("Sending request to Groq API with model:", chatRequest.model);
    
    // Make request to Groq API
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      chatRequest,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error("Error calling Groq API:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return res.status(error.response?.status || 500).json({ 
        message: "Error from Groq API",
        error: error.response?.data || error.message
      });
    }
    res.status(500).json({ message: "Failed to get AI response", error: error.message });
  }
});

export default router; 