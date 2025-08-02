import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { puterAI } from "@/lib/puterAI";
import type { Pdf, StudyNotes, GenerateNotesRequest } from "@shared/schema";
import { FileText, Save, Download, Printer } from "lucide-react";

export default function NotesPage() {
  const [selectedPdfId, setSelectedPdfId] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState("all");
  const [notesStyle, setNotesStyle] = useState("summary");
  const [includeKeyTerms, setIncludeKeyTerms] = useState(true);
  const [includeExamples, setIncludeExamples] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<StudyNotes | null>(null);
  const { toast } = useToast();

  const { data: pdfs = [] } = useQuery<Pdf[]>({
    queryKey: ["/api/pdfs"],
  });

  const { data: notesList = [] } = useQuery<StudyNotes[]>({
    queryKey: ["/api/notes", selectedPdfId],
    enabled: !!selectedPdfId,
  });

  const generateMutation = useMutation({
    mutationFn: async (request: GenerateNotesRequest) => {
      // Check if Puter.js is available
      if (!puterAI.isAvailable()) {
        throw new Error("AI service not available. Please refresh the page.");
      }

      // Get PDF content from backend
      const response = await apiRequest("POST", "/api/notes/generate", request);
      const { textContent, pdfName } = await response.json();

      // Generate notes using Puter.js
      const notesContent = await puterAI.generateStudyNotes(request, textContent);

      // Save notes to backend
      const saveResponse = await apiRequest("POST", "/api/notes/save", {
        pdfId: request.pdfId,
        title: `${pdfName} - ${request.style} notes`,
        content: notesContent,
        style: request.style,
        chapter: request.chapter,
        includeKeyTerms: request.includeKeyTerms,
        includeExamples: request.includeExamples,
      });

      return saveResponse.json();
    },
    onSuccess: (notes: StudyNotes) => {
      setGeneratedNotes(notes);
      toast({
        title: "Success",
        description: "Study notes generated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate notes",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!selectedPdfId) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive",
      });
      return;
    }

    const request: GenerateNotesRequest = {
      pdfId: selectedPdfId,
      style: notesStyle as "summary" | "detailed" | "outline",
      chapter: selectedChapter === "all" ? undefined : selectedChapter,
      includeKeyTerms,
      includeExamples,
    };

    generateMutation.mutate(request);
  };

  const handleSave = () => {
    toast({
      title: "Saved",
      description: "Notes have been saved successfully!",
    });
  };

  const handleExport = () => {
    if (generatedNotes) {
      const blob = new Blob([generatedNotes.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedNotes.title}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handlePrint = () => {
    if (generatedNotes) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${generatedNotes.title}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 2rem; }
                h1, h2, h3, h4 { color: #1f2937; }
                .bg-blue-50 { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; margin: 1rem 0; }
                .bg-yellow-50 { background-color: #fefce8; border-left: 4px solid #eab308; padding: 1rem; margin: 1rem 0; }
                .bg-green-50 { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 1rem; margin: 1rem 0; }
              </style>
            </head>
            <body>${generatedNotes.content}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const selectedPdf = pdfs.find(pdf => pdf.id === selectedPdfId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Notes Generator</h1>
        <p className="text-gray-600">Generate comprehensive study notes from your uploaded documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Notes Configuration */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Notes Settings</h2>
              
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Select Document</Label>
                <Select value={selectedPdfId} onValueChange={setSelectedPdfId} data-testid="select-document">
                  <SelectTrigger className="text-sm">
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

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Chapter/Section</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter} data-testid="select-chapter">
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Entire Document</SelectItem>
                    <SelectItem value="ch1">Chapter 1: Introduction</SelectItem>
                    <SelectItem value="ch2">Chapter 2: Main Content</SelectItem>
                    <SelectItem value="ch3">Chapter 3: Advanced Topics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2">Notes Style</Label>
                <RadioGroup value={notesStyle} onValueChange={setNotesStyle} data-testid="notes-style">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="summary" id="summary" />
                    <Label htmlFor="summary" className="text-sm">Summary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="detailed" id="detailed" />
                    <Label htmlFor="detailed" className="text-sm">Detailed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="outline" id="outline" />
                    <Label htmlFor="outline" className="text-sm">Outline</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-terms"
                    checked={includeKeyTerms}
                    onCheckedChange={setIncludeKeyTerms}
                  />
                  <Label htmlFor="include-terms" className="text-sm">Include key terms</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-examples"
                    checked={includeExamples}
                    onCheckedChange={setIncludeExamples}
                  />
                  <Label htmlFor="include-examples" className="text-sm">Include examples</Label>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !selectedPdfId}
                className="w-full gradient-primary text-white"
                data-testid="generate-notes-button"
              >
                <FileText className="mr-2" size={16} />
                {generateMutation.isPending ? "Generating..." : "Generate Notes"}
              </Button>

              {notesList.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Notes</h3>
                  <div className="space-y-2">
                    {notesList.slice(0, 3).map((notes) => (
                      <Button
                        key={notes.id}
                        variant="ghost"
                        className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                        onClick={() => setGeneratedNotes(notes)}
                        data-testid={`recent-notes-${notes.id}`}
                      >
                        <div>
                          <div className="font-medium truncate">{notes.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(notes.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes Display */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Study Notes</h2>
                {generatedNotes && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSave}
                      data-testid="save-notes"
                      className="text-xs"
                    >
                      <Save className="mr-1" size={12} />
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExport}
                      data-testid="export-notes"
                      className="text-xs"
                    >
                      <Download className="mr-1" size={12} />
                      Export
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrint}
                      data-testid="print-notes"
                      className="text-xs"
                    >
                      <Printer className="mr-1" size={12} />
                      Print
                    </Button>
                  </div>
                )}
              </div>

              {generateMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-gray-600">Generating study notes...</p>
                </div>
              ) : generatedNotes ? (
                <div 
                  className="prose prose-lg max-w-none"
                  data-testid="generated-notes"
                  dangerouslySetInnerHTML={{ __html: generatedNotes.content }}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select a document and click "Generate Notes" to create your study guide</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
