import { useState, useEffect, useRef, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage, prepareChatMessages, getChatCompletion } from "@/lib/groq";
import { saveChatMessage, getChatMessages, FirebaseChatMessage } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthModal } from "@/components/AuthModal";

interface Message {
  id: string | number;
  content: string;
  isUserMessage: boolean;
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch messages from Firebase when user logs in
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) {
        // Add default welcome message for non-logged in users
        const welcomeMessage = {
          id: 0,
          content: "Hello! I'm StudentGuideAI, your intelligent educational assistant. How can I help you today?",
          isUserMessage: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        return;
      }

      setIsLoadingMessages(true);
      try {
        const firebaseMessages = await getChatMessages(user.uid);
        console.log("Firebase messages:", firebaseMessages);

        if (firebaseMessages && firebaseMessages.length > 0) {
          // Convert Firebase messages to our local format
          const formattedMessages: Message[] = firebaseMessages.map(msg => ({
            id: msg.id || Date.now().toString(),
            content: msg.content,
            isUserMessage: msg.isUserMessage,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
          }));

          setMessages(formattedMessages);
        } else {
          // Add welcome message if no messages
          const welcomeMessage = {
            id: Date.now().toString(),
            content: "Hello! I'm StudentGuideAI, your intelligent educational assistant. How can I help you today?",
            isUserMessage: false,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);

          // Save welcome message to Firebase
          await saveChatMessage({
            content: welcomeMessage.content,
            isUserMessage: welcomeMessage.isUserMessage,
            userId: user.uid
          });
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load chat history. Please try again.",
          variant: "destructive",
        });

        // Still show welcome message if error
        const welcomeMessage = {
          id: Date.now().toString(),
          content: "Hello! I'm StudentGuideAI, your intelligent educational assistant. How can I help you today?",
          isUserMessage: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [user, toast]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Check if user is logged in
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const userMessage = {
      id: Date.now(),
      content: input.trim(),
      isUserMessage: true,
      timestamp: new Date(),
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Save user message to Firebase
      await saveChatMessage({
        content: userMessage.content,
        isUserMessage: true,
        userId: user.uid
      });

      // Prepare messages for AI
      const chatHistory: ChatMessage[] = messages.map(msg => ({
        role: msg.isUserMessage ? "user" : "assistant",
        content: msg.content
      }));

      // Add the new user message
      chatHistory.push({
        role: "user",
        content: userMessage.content
      });

      // Get AI response
      const chatMessages = prepareChatMessages(chatHistory);
      const completion = await getChatCompletion(chatMessages);

      if (completion && completion.choices && completion.choices.length > 0) {
        const aiResponse = completion.choices[0].message.content;

        // Add AI response to UI
        const aiMessage = {
          id: Date.now() + 1,
          content: aiResponse,
          isUserMessage: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Save AI message to Firebase
        await saveChatMessage({
          content: aiResponse,
          isUserMessage: false,
          userId: user.uid
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleQuickQuery = (query: string) => {
    setInput(query);
    // Focus the textarea
    const textarea = document.getElementById("message-input") as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-primary text-white px-6 py-4">
            <CardTitle className="text-xl font-semibold flex items-center space-x-3">
              <i className="fas fa-robot text-2xl"></i>
              <span>College Admissions Assistant</span>
              <div className="flex-grow"></div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-primary-700 rounded-full w-8 h-8"
              >
                <i className="fas fa-info-circle"></i>
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Chat messages container */}
            <div 
              ref={chatContainerRef} 
              className="h-[500px] overflow-y-auto p-6 space-y-6 bg-gray-50"
            >
              {isLoadingMessages ? (
                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="flex items-end justify-end space-x-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/2 ml-auto" />
                      <Skeleton className="h-4 w-1/3 ml-auto" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start space-x-3 ${message.isUserMessage ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div className="flex-shrink-0">
                      <Avatar className="h-10 w-10 ring-2 ring-white">
                        {message.isUserMessage ? (
                          <>
                            <AvatarImage src={user?.photoURL || undefined} />
                            <AvatarFallback className="bg-primary-100 text-primary-700">
                              {user?.displayName?.[0] || user?.email?.[0] || <i className="fas fa-user"></i>}
                            </AvatarFallback>
                          </>
                        ) : (
                          <AvatarFallback className="bg-primary text-white">
                            <i className="fas fa-robot"></i>
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className={`flex flex-col space-y-1 max-w-[80%]`}>
                      <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                        message.isUserMessage 
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white text-gray-800 rounded-tl-none"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                      <span className={`text-xs text-gray-400 ${message.isUserMessage ? "text-right" : "text-left"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white">
                      <i className="fas fa-robot"></i>
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input area */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <div className="flex-grow relative">
                  <Textarea 
                    id="message-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleEnterKey}
                    placeholder="Type your message..."
                    className="resize-none min-h-[50px] max-h-[150px] pr-12 rounded-2xl border-gray-200 focus:border-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    className="absolute bottom-2 right-2 bg-primary text-white rounded-full w-8 h-8 p-0 hover:bg-primary-600 transition-colors"
                    disabled={isLoading || !input.trim()}
                  >
                    <i className="fas fa-paper-plane text-sm"></i>
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Quick Queries */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-gray-500 mb-4 flex items-center">
            <i className="fas fa-lightbulb text-primary mr-2"></i>
            Suggested Questions
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="justify-start text-left bg-white hover:bg-gray-50 border-gray-200 hover:border-primary transition-colors"
              onClick={() => handleQuickQuery("What are the admission requirements for Gujarat University?")}
            >
              <i className="fas fa-university mr-2 text-primary"></i>
              Gujarat University Requirements
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-left bg-white hover:bg-gray-50 border-gray-200 hover:border-primary transition-colors"
              onClick={() => handleQuickQuery("Tell me about GUJCET exam dates and pattern")}
            >
              <i className="fas fa-calendar-alt mr-2 text-primary"></i>
              GUJCET Exam Details
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-left bg-white hover:bg-gray-50 border-gray-200 hover:border-primary transition-colors"
              onClick={() => handleQuickQuery("What are the top engineering colleges in Gujarat?")}
            >
              <i className="fas fa-cog mr-2 text-primary"></i>
              Top Engineering Colleges
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-left bg-white hover:bg-gray-50 border-gray-200 hover:border-primary transition-colors"
              onClick={() => handleQuickQuery("What are the medical college cutoffs in Gujarat?")}
            >
              <i className="fas fa-hospital mr-2 text-primary"></i>
              Medical College Cutoffs
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;