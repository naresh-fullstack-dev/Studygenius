import type { ChatMessage } from "@shared/schema";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const timestamp = new Date(message.createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div
      className={cn(
        "flex items-start space-x-3",
        isUser ? "justify-end" : ""
      )}
      data-testid={`message-${message.role}`}
    >
      {!isUser && (
        <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="text-white" size={16} />
        </div>
      )}
      
      <div
        className={cn(
          "rounded-lg p-3 max-w-sm lg:max-w-md",
          isUser
            ? "bg-primary text-white rounded-tr-none"
            : "bg-gray-100 rounded-tl-none"
        )}
      >
        <p className={cn("text-sm", isUser ? "text-white" : "text-gray-800")}>
          {message.content}
        </p>
        <span
          className={cn(
            "text-xs mt-1 block",
            isUser ? "text-blue-200" : "text-gray-500"
          )}
        >
          {timestamp}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="text-gray-600" size={16} />
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3" data-testid="typing-indicator">
      <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="text-white" size={16} />
      </div>
      <div className="bg-gray-100 rounded-lg rounded-tl-none p-3">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
      </div>
    </div>
  );
}
