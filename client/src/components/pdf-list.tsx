// client/src/components/pdf-list.tsx
import { useEffect, useState } from "react";

export default function PdfList() {
  const [pdfs, setPdfs] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/list-uploads")
      .then((res) => res.json())
      .then((data) => setPdfs(data));
  }, []);

  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">Uploaded PDFs</h3>
      {pdfs.length === 0 ? (
        <p className="text-gray-500">No PDFs uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {pdfs.map((file) => (
            <li key={file}>
              <a
                href={`/uploads/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {file}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
