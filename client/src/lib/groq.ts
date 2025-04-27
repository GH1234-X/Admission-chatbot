import { config } from "../config/env";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

export const getChatCompletion = async (messages: ChatMessage[]): Promise<ChatResponse> => {
  try {
    // Use our backend API endpoint instead of calling Groq directly
    const response = await fetch("/api/chat/completion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error details:", errorData);
      throw new Error(errorData.message || errorData.error || 'Failed to get chat completion');
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting chat completion:", error);
    throw error;
  }
};

// Helper function to prepare chat history
export const prepareChatMessages = (messages: ChatMessage[]): ChatMessage[] => {
  // Add system message at the beginning if it doesn't exist
  if (messages.length === 0 || messages[0].role !== "system") {
    return [
      {
        role: "system",
        content: `You are an AI-powered Admission Assistant Chatbot specialized in Gujarat Colleges like CSPIT, CHARUSAT, DDU, Nirma, PDPU, IITRAM, and others.

Your job is:
- Give **direct, clear, and factual answers** about college admission-related queries.
- Provide **approximate fee**, **last year's cutoff**, **eligibility criteria**, **admission process** clearly.
- Always **attach the official college website link** in the answer.
- Do **NOT** suggest users to visit websites or contact admissions unless no information is available.
- **Never say** "I am an AI model" or "I cannot find it."
- If the exact fee or cutoff is unknown, **give an approximate value** confidently and clearly say "approximate."
- Always keep the answer **short, structured**, and **professional** (no unnecessary words).
- Reply in **simple and easy English** understandable to a student.

Format your answer like this:

---
**Answer:**

{Precise short answer with approximate numbers if needed.}

🔗 Official Website: {link}`
      },
      ...messages
    ];
  }
  return messages;
};
