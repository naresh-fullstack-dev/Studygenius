import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChatMessageComponent, TypingIndicator } from "@/components/chat-message";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { puterAI } from "@/lib/puterAI";
import type { Pdf, ChatMessage } from "@shared/schema";
import { Bot, Send, Trash2, Lightbulb, Calculator, HelpCircle, Minus, Paperclip } from "lucide-react";

export default function ChatPage() {
  const [selectedPdfId, setSelectedPdfId] = useState<string>("");
  const [tutoringStyle, setTutoringStyle] = useState("explanatory");
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pdfs = [] } = useQuery<Pdf[]>({
    queryKey: ["/api/pdfs"],
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages", selectedPdfId],
    refetchInterval: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      setIsTyping(true);
      
      // Check if Puter.js is available
      if (!puterAI.isAvailable()) {
        throw new Error("AI service not available. Please refresh the page.");
      }

      // Save user message and get context
      const response = await apiRequest("POST", "/api/chat/message", {
        role: "user",
        content,
        pdfId: selectedPdfId || undefined,
      });
      const { userMessage, chatHistory, pdfContent } = await response.json();

      // Generate AI response using Puter.js
      const aiResponse = await puterAI.generateChatResponse(chatHistory, pdfContent);

      // Save AI response
      await apiRequest("POST", "/api/chat/response", {
        content: aiResponse,
        pdfId: selectedPdfId || undefined,
      });

      return { userMessage, aiResponse };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedPdfId] });
      setMessageInput("");
      setIsTyping(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/chat/clear?pdfId=${selectedPdfId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages", selectedPdfId] });
      toast({
        title: "Success",
        description: "Chat cleared successfully",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(messageInput.trim());
  };

  const handleQuickQuestion = (question: string) => {
    setMessageInput(question);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Add welcome message if no messages exist
  const displayMessages = messages.length === 0 ? [
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI tutor. I'm here to help you understand concepts, solve problems, and answer questions. How can I assist you today?",
      createdAt: new Date().toISOString(),
      pdfId: null,
    } as ChatMessage
  ] : messages;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tutor Chat</h1>
        <p className="text-gray-600">Get personalized help and explanations from your AI tutor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chat Settings Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Chat Settings</h2>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Reference Document</Label>
                <Select value={selectedPdfId} onValueChange={setSelectedPdfId} data-testid="select-reference-document">
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="General tutoring" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General tutoring</SelectItem>
                    {pdfs.map((pdf) => (
                      <SelectItem key={pdf.id} value={pdf.id}>
                        {pdf.originalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Tutoring Style</Label>
                <Select value={tutoringStyle} onValueChange={setTutoringStyle} data-testid="select-tutoring-style">
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explanatory">Explanatory</SelectItem>
                    <SelectItem value="socratic">Socratic Method</SelectItem>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm text-gray-600 hover:bg-gray-50"
                    onClick={() => handleQuickQuestion("Can you explain this concept to me?")}
                    data-testid="quick-explain"
                  >
                    <Lightbulb className="mr-2 text-yellow-500" size={16} />
                    Explain a concept
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm text-gray-600 hover:bg-gray-50"
                    onClick={() => handleQuickQuestion("I need help solving a problem")}
                    data-testid="quick-problem"
                  >
                    <Calculator className="mr-2 text-blue-500" size={16} />
                    Help with problem
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm text-gray-600 hover:bg-gray-50"
                    onClick={() => handleQuickQuestion("Can you quiz me on this topic?")}
                    data-testid="quick-quiz"
                  >
                    <HelpCircle className="mr-2 text-green-500" size={16} />
                    Quiz me
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => clearChatMutation.mutate()}
                disabled={clearChatMutation.isPending}
                className="w-full text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
                data-testid="clear-chat"
              >
                <Trash2 className="mr-2" size={16} />
                Clear Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">AI Tutor</h3>
                  <p className="text-xs text-green-500 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Online
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-gray-400 hover:text-gray-600"
                data-testid="minimize-chat"
              >
                <Minus size={16} />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4" data-testid="chat-messages">
              {displayMessages.map((message) => (
                <ChatMessageComponent key={message.id} message={message} />
              ))}
              
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <Textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="resize-none"
                    rows={1}
                    data-testid="message-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-2 text-gray-400 hover:text-gray-600"
                    data-testid="attach-file"
                  >
                    <Paperclip size={16} />
                  </Button>
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="gradient-primary text-white"
                    data-testid="send-message"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
