import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
// Remove CSS imports - will be handled by the PDF library

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  filePath?: string;
  className?: string;
}

export function PdfViewer({ filePath, className = "" }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    setError("Failed to load PDF");
    setLoading(false);
    console.error("PDF load error:", error);
  }

  if (!filePath) {
    return (
      <div className={`bg-gray-100 rounded-lg h-96 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <FileText size={48} className="mx-auto mb-3 opacity-50" />
          <p>Upload a PDF to see preview</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-100 rounded-lg h-96 flex items-center justify-center ${className}`}>
        <div className="text-center text-red-500">
          <FileText size={48} className="mx-auto mb-3 opacity-50" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <div className="h-96 flex flex-col">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p>Loading PDF...</p>
            </div>
          </div>
        )}
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Document
            file={filePath}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="max-w-full"
          >
            <Page
              pageNumber={pageNumber}
              width={300}
              className="border border-gray-300 shadow-sm"
            />
          </Document>
        </div>

        {numPages && numPages > 1 && (
          <div className="border-t border-gray-200 p-3 flex items-center justify-between bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              data-testid="pdf-prev-page"
            >
              <ChevronLeft size={16} />
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              data-testid="pdf-next-page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
