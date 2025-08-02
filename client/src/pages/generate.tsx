import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { QuestionDisplay } from "@/components/question-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { puterAI } from "@/lib/puterAI";
import type { Pdf, Question, GenerateQuestionsRequest } from "@shared/schema";
import { Wand2 } from "lucide-react";

export default function GeneratePage() {
  const [selectedPdfId, setSelectedPdfId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionTypes, setQuestionTypes] = useState<string[]>(["mcq", "short", "true_false"]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pdfs = [] } = useQuery<Pdf[]>({
    queryKey: ["/api/pdfs"],
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/questions", selectedPdfId],
    enabled: !!selectedPdfId,
  });

  const generateMutation = useMutation({
    mutationFn: async (request: GenerateQuestionsRequest) => {
      // Check if Puter.js is available
      if (!puterAI.isAvailable()) {
        throw new Error("AI service not available. Please refresh the page.");
      }

      // Get PDF content from backend
      const response = await apiRequest("POST", "/api/questions/generate", request);
      const { textContent } = await response.json();

      // Generate questions using Puter.js
      const generatedQuestions = await puterAI.generateQuestions(request, textContent);

      // Save questions to backend
      const saveResponse = await apiRequest("POST", "/api/questions/save", {
        pdfId: request.pdfId,
        questions: generatedQuestions
      });

      return saveResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Questions generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questions", selectedPdfId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate questions",
        variant: "destructive",
      });
    },
  });

  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setQuestionTypes(prev => [...prev, type]);
    } else {
      setQuestionTypes(prev => prev.filter(t => t !== type));
    }
  };

  const handleGenerate = () => {
    if (!selectedPdfId) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive",
      });
      return;
    }

    if (questionTypes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one question type",
        variant: "destructive",
      });
      return;
    }

    const request: GenerateQuestionsRequest = {
      pdfId: selectedPdfId,
      count: parseInt(questionCount),
      difficulty: difficulty as "easy" | "medium" | "hard",
      types: questionTypes as ("mcq" | "short" | "long" | "true_false" | "fill_blank")[],
    };

    generateMutation.mutate(request);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Generator</h1>
        <p className="text-gray-600">Generate custom questions from your uploaded documents using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Question Settings</h2>
              
              {/* Document Selection */}
              <div className="space-y-2">
                <Label>Select Document</Label>
                <Select value={selectedPdfId} onValueChange={setSelectedPdfId} data-testid="select-document">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a document..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pdfs.map((pdf) => (
                      <SelectItem key={pdf.id} value={pdf.id}>
                        {pdf.originalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Number of Questions */}
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Select value={questionCount} onValueChange={setQuestionCount} data-testid="select-question-count">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Level */}
              <div className="space-y-3">
                <Label>Difficulty Level</Label>
                <RadioGroup value={difficulty} onValueChange={setDifficulty} data-testid="difficulty-selection">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy">Easy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard">Hard</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Question Types */}
              <div className="space-y-3">
                <Label>Question Types</Label>
                <div className="space-y-3" data-testid="question-types">
                  {[
                    { id: "mcq", label: "Multiple Choice" },
                    { id: "short", label: "Short Answer" },
                    { id: "long", label: "Long Answer" },
                    { id: "true_false", label: "True/False" },
                    { id: "fill_blank", label: "Fill in the Blanks" },
                  ].map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={questionTypes.includes(type.id)}
                        onCheckedChange={(checked) => handleQuestionTypeChange(type.id, !!checked)}
                      />
                      <Label htmlFor={type.id}>{type.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !selectedPdfId}
                className="w-full gradient-primary text-white"
                data-testid="generate-questions-button"
              >
                <Wand2 className="mr-2" size={16} />
                {generateMutation.isPending ? "Generating..." : "Generate Questions"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Questions Display */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {generateMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-600">Generating questions with AI...</p>
                </div>
              ) : (
                <QuestionDisplay
                  questions={questions}
                  onRegenerate={handleGenerate}
                  onExport={() => {
                    // TODO: Implement export functionality
                    toast({
                      title: "Export",
                      description: "Export functionality coming soon!",
                    });
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
