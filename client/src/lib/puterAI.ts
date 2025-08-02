// Puter.js AI service for frontend AI operations
import type { GenerateQuestionsRequest, GenerateNotesRequest, Question } from "@shared/schema";

// Declare puter global variable
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (prompt: string, options?: { model?: string; stream?: boolean }) => Promise<any>;
        txt2img: (prompt: string) => Promise<HTMLImageElement>;
      };
    };
  }
}

export class PuterAIService {
  private defaultModel = "gpt-4o";

  async generateQuestions(request: GenerateQuestionsRequest, textContent: string): Promise<Partial<Question>[]> {
    const prompt = `Generate ${request.count} ${request.difficulty} difficulty questions from the following text content. 

Include these question types: ${request.types.join(', ')}.

Text content:
${textContent}

For each question, provide:
- type: one of ${request.types.join(', ')}
- difficulty: ${request.difficulty}
- question: the question text
- options: array of 4 options for MCQ questions (null for others)
- correctAnswer: the correct answer
- explanation: brief explanation of the answer

Return as JSON with this structure:
{
  "questions": [
    {
      "type": "mcq",
      "difficulty": "medium",
      "question": "What is...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}`;

    try {
      const response = await window.puter.ai.chat(prompt, { model: this.defaultModel });
      
      // Parse the response - Puter.js returns the text directly
      let result;
      try {
        result = JSON.parse(response);
      } catch {
        // If not valid JSON, try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse AI response");
        }
      }
      
      return result.questions || [];
    } catch (error) {
      console.error("Error generating questions:", error);
      throw new Error("Failed to generate questions. Please try again.");
    }
  }

  async generateChatResponse(messages: Array<{role: string, content: string}>, pdfContent?: string): Promise<string> {
    const systemContext = `You are a helpful educational tutor. You provide clear, encouraging explanations and help students understand concepts. ${pdfContent ? `You have access to the following study material:\n\n${pdfContent.substring(0, 2000)}` : 'You provide general tutoring assistance.'}

Guidelines:
- Be encouraging and supportive
- Break down complex concepts into simple steps
- Use examples when helpful
- Ask follow-up questions to check understanding
- If referencing the provided material, be specific about which concepts you're discussing`;

    // Combine system context with the latest user message
    const latestMessage = messages[messages.length - 1];
    const fullPrompt = `${systemContext}\n\nStudent: ${latestMessage.content}`;

    try {
      const response = await window.puter.ai.chat(fullPrompt, { model: this.defaultModel });
      return response || "I'm sorry, I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error("Error generating chat response:", error);
      throw new Error("Failed to generate response. Please try again.");
    }
  }

  async generateStudyNotes(request: GenerateNotesRequest, textContent: string): Promise<string> {
    const styleInstructions = {
      summary: "Create a concise summary highlighting the main points and key concepts.",
      detailed: "Create comprehensive notes with detailed explanations, examples, and elaborations.",
      outline: "Create a structured outline format with main topics, subtopics, and bullet points."
    };

    const prompt = `Generate ${request.style} study notes from the following content.

${request.chapter ? `Focus on: ${request.chapter}` : 'Cover the entire document.'}

Requirements:
- Style: ${styleInstructions[request.style]}
- ${request.includeKeyTerms ? 'Include a section with key terms and definitions' : ''}
- ${request.includeExamples ? 'Include relevant examples and case studies' : ''}
- Use clear headings and formatting
- Make it suitable for studying and review

Text content:
${textContent}

Format the response as HTML with proper headings (h1, h2, h3), paragraphs, lists, and emphasis. Include color-coded sections for key information:
- Use class "bg-blue-50 border-l-4 border-blue-500 p-4" for key concepts
- Use class "bg-yellow-50 border-l-4 border-yellow-500 p-4" for important terms
- Use class "bg-green-50 border-l-4 border-green-500 p-4" for examples or tips`;

    try {
      const response = await window.puter.ai.chat(prompt, { model: this.defaultModel });
      return response || "Failed to generate notes. Please try again.";
    } catch (error) {
      console.error("Error generating study notes:", error);
      throw new Error("Failed to generate study notes. Please try again.");
    }
  }

  // Check if Puter.js is available
  isAvailable(): boolean {
    return typeof window !== 'undefined' && window.puter && window.puter.ai;
  }
}

export const puterAI = new PuterAIService();