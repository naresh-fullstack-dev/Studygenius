import { useState } from "react";
import type { Question } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, RefreshCw } from "lucide-react";

interface QuestionDisplayProps {
  questions: Question[];
  onRegenerate?: () => void;
  onExport?: () => void;
}

const questionTypeColors = {
  mcq: "bg-blue-100 text-blue-800",
  short: "bg-purple-100 text-purple-800",
  long: "bg-orange-100 text-orange-800",
  true_false: "bg-green-100 text-green-800",
  fill_blank: "bg-yellow-100 text-yellow-800",
};

const questionTypeLabels = {
  mcq: "Multiple Choice",
  short: "Short Answer",
  long: "Long Answer",
  true_false: "True/False",
  fill_blank: "Fill in the Blanks",
};

export function QuestionDisplay({ questions, onRegenerate, onExport }: QuestionDisplayProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">❓</span>
        </div>
        <p>Configure your settings and click "Generate Questions" to start</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Generated Questions</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            data-testid="export-questions"
            className="text-xs"
          >
            <Download className="mr-1" size={12} />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            data-testid="regenerate-questions"
            className="text-xs"
          >
            <RefreshCw className="mr-1" size={12} />
            Regenerate
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card key={question.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 text-xs rounded ${questionTypeColors[question.type as keyof typeof questionTypeColors]}`}>
                  {questionTypeLabels[question.type as keyof typeof questionTypeLabels]}
                </span>
                <span className="text-xs text-gray-500">
                  Question {index + 1} of {questions.length}
                </span>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-3">
                {question.question}
              </h3>

              {question.type === "mcq" && question.options && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  data-testid={`question-${question.id}-options`}
                >
                  {(question.options as string[]).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <RadioGroupItem value={option} id={`${question.id}-option-${optionIndex}`} />
                      <Label
                        htmlFor={`${question.id}-option-${optionIndex}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "true_false" && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  className="flex space-x-4"
                  data-testid={`question-${question.id}-true-false`}
                >
                  <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <RadioGroupItem value="true" id={`${question.id}-true`} />
                    <Label htmlFor={`${question.id}-true`} className="cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <RadioGroupItem value="false" id={`${question.id}-false`} />
                    <Label htmlFor={`${question.id}-false`} className="cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {(question.type === "short" || question.type === "long" || question.type === "fill_blank") && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className={question.type === "long" ? "h-32" : "h-20"}
                  data-testid={`question-${question.id}-answer`}
                />
              )}

              {question.explanation && (
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
