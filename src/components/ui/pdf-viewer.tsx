'use client'

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  // Construct the proxy URL
  const proxyUrl = `/api/proxy/pdf?url=${encodeURIComponent(url)}`;

  return (
    <div className="w-full h-full">
      <iframe
        src={proxyUrl}
        title="PDF Viewer"
        className="w-full h-full"
        style={{ border: 'none' }}
      >
        <p>
          Your browser does not support PDFs. Please download the PDF to view it:
          <a href={url}>Download PDF</a>.
        </p>
      </iframe>
    </div>
  );
}
