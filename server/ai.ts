import { PuterAI } from "puter";
import type { GenerateQuestionsRequest, Question } from "@shared/schema";

const ai = new PuterAI();

export class AIService {
  async generateQuestions(
    request: GenerateQuestionsRequest,
    textContent: string
  ): Promise<Partial<Question>[]> {
    const prompt = `Generate ${request.count} ${request.difficulty} difficulty questions from the following text.

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

Return as JSON array with this structure:
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
      const response = await ai.chat(prompt);
      const json = JSON.parse(response);
      return json.questions;
    } catch (err) {
      console.error("AI generation error:", err);
      return [];
    }
  }
}
