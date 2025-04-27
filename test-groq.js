// Simple script to test the Groq API
require('dotenv').config();
const axios = require('axios');

async function testGroqAPI() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is not set in the environment variables");
      return;
    }

    console.log("Using Groq API key:", apiKey.substring(0, 5) + "...");

    const chatRequest = {
      messages: [
        { role: "user", content: "Hello, how are you?" }
      ],
      model: "llama2-70b-4096"
    };

    console.log("Sending request to Groq API...");
    
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      chatRequest,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      }
    );

    console.log("Response from Groq API:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("Error testing Groq API:", error.message);
    if (error.response) {
      console.error("Error details:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  }
}

testGroqAPI(); 