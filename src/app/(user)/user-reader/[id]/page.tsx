import { getBookById } from '@/app/dashboard/books/actions';
import { PDFViewer } from '@/components/reader/pdf-viewer';
import { notFound } from 'next/navigation';

interface UserReaderPageProps {
  params: {
    id: string;
  };
}

export default async function UserReaderPage({ params: { id } }: UserReaderPageProps) {
  const book = await getBookById(id);

  if (!book || !book.fileUrl) {
    return notFound();
  }

  return (
    // Full width by removing horizontal padding, calculated height for viewport fit
    <div className="-mx-4 h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      <PDFViewer fileUrl={book.fileUrl} className="h-full" />
    </div>
  );
}
