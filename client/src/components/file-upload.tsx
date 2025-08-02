import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("pdf", file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await fetch("/api/pdfs/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "PDF uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pdfs"] });
      setUploadProgress(0);
      onUploadComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload PDF",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadProgress(5);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        data-testid="file-upload-dropzone"
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-primary"
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="text-primary" size={32} />
            </div>
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? "Drop your PDF here" : "Drop your PDF here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              type="button"
              data-testid="choose-file-button"
              className="gradient-primary text-white"
              disabled={uploadMutation.isPending}
            >
              <Plus className="mr-2" size={16} />
              Choose File
            </Button>
          </div>
        </div>
      </div>

      {uploadProgress > 0 && (
        <div data-testid="upload-progress" className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>Supported formats: PDF (Max size: 10MB)</p>
      </div>
    </div>
  );
}
