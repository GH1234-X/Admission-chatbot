import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { insertChatMessageSchema, insertUserSchema } from "@shared/schema";

interface GroqChatMessage {
  role: string;
  content: string;
}

interface GroqChatRequest {
  messages: GroqChatMessage[];
  model: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Firebase user registration
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      const user = await storage.createUser(userData);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Chat messages
  app.get("/api/chat/messages", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      if (userId) {
        const messages = await storage.getChatMessages(userId);
        res.json(messages);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // College cutoffs
  app.get("/api/college-cutoffs", async (req: Request, res: Response) => {
    try {
      const { country, university, program, academicYear } = req.query;
      const filters: any = {};
      
      if (country) filters.country = country;
      if (university) filters.university = university;
      if (program) filters.program = program;
      if (academicYear) filters.academicYear = academicYear;
      
      const cutoffs = await storage.getCollegeCutoffs(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(cutoffs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch college cutoffs" });
    }
  });
  
  // Get unique programs from college cutoffs
  app.get("/api/college-cutoffs/programs", async (req: Request, res: Response) => {
    try {
      const uniquePrograms = await storage.getUniqueCollegeCutoffPrograms();
      res.json(uniquePrograms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unique programs" });
    }
  });
  
  // Get unique universities from college cutoffs
  app.get("/api/college-cutoffs/universities", async (req: Request, res: Response) => {
    try {
      const uniqueUniversities = await storage.getUniqueCollegeCutoffUniversities();
      res.json(uniqueUniversities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unique universities" });
    }
  });
  
  // Get unique countries from college cutoffs
  app.get("/api/college-cutoffs/countries", async (req: Request, res: Response) => {
    try {
      const uniqueCountries = await storage.getUniqueCollegeCutoffCountries();
      res.json(uniqueCountries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unique countries" });
    }
  });

  // Scholarships
  app.get("/api/scholarships", async (req: Request, res: Response) => {
    try {
      const { fieldOfStudy, amount, deadline, eligibility } = req.query;
      const filters: any = {};
      
      if (fieldOfStudy) filters.fieldOfStudy = fieldOfStudy;
      if (amount) filters.amount = amount;
      if (deadline) filters.deadline = deadline;
      if (eligibility) filters.eligibility = eligibility;
      
      const scholarships = await storage.getScholarships(Object.keys(filters).length > 0 ? filters : undefined);
      res.json(scholarships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholarships" });
    }
  });

  // Groq AI chat completion
  app.post("/api/chat/completion", async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      
      // Validate request
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      
      // Get Groq API key from environment
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        console.error("Groq API key is missing from environment variables");
        return res.status(500).json({ message: "Groq API key not configured" });
      }
      
      console.log("Using Groq API key:", apiKey.substring(0, 5) + "...");
      
      const chatRequest: GroqChatRequest = {
        messages,
        model: "llama3-70b-8192", // Using Llama3 model as requested
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
    } catch (error: any) {
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

  const httpServer = createServer(app);
  return httpServer;
}
