import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { PdfViewer } from "@/components/pdf-viewer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Pdf } from "@shared/schema";
import { Eye, Trash2, FileText } from "lucide-react";

export default function UploadPage() {
  const [selectedPdf, setSelectedPdf] = useState<Pdf | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pdfs = [], isLoading } = useQuery<Pdf[]>({
    queryKey: ["/api/pdfs"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pdfs/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PDF deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pdfs"] });
      if (selectedPdf) setSelectedPdf(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete PDF",
        variant: "destructive",
      });
    },
  });

  const handlePreview = (pdf: Pdf) => {
    setSelectedPdf(pdf);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this PDF?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatUploadDate = (date: string | Date) => {
    const uploadDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return "Just now";
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Study Material</h1>
        <p className="text-gray-600">Upload your PDF documents to get started with AI-powered learning tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Document</h2>
            <FileUpload />
          </CardContent>
        </Card>

        {/* PDF Preview Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Preview</h2>
            <PdfViewer filePath={selectedPdf?.filePath} />
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files List */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Documents</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading documents...</p>
            </div>
          ) : pdfs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload your first PDF to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  data-testid={`pdf-item-${pdf.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-red-600" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pdf.originalName}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(pdf.fileSize)} • Uploaded {formatUploadDate(pdf.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(pdf)}
                      data-testid={`preview-pdf-${pdf.id}`}
                      className="p-2 text-gray-400 hover:text-primary"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pdf.id)}
                      data-testid={`delete-pdf-${pdf.id}`}
                      className="p-2 text-gray-400 hover:text-red-600"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
