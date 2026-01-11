'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Upload, Download, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { bulkImportBooks, BulkImportResult, BookImportRow } from '../actions/bulk-import'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BulkImportDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BulkImportDrawer({ open, onOpenChange, onSuccess }: BulkImportDrawerProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<BookImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BulkImportResult | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'result'>('upload')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'))
    if (csvFile) {
      setFile(csvFile)

      // Parse CSV on client side
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedRows(results.data as BookImportRow[])
          setCurrentStep('preview')
          setResult(null)
        },
        error: (error) => {
          console.error('CSV parsing error:', error)
        },
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  const handleDownloadTemplate = () => {
    const template = `name,type,authors,publication,categories,series,seriesOrder,summary,buyingPrice,sellingPrice,numberOfCopies,bindingType,pageNumber,isPublic,requiresPremium
"Example Book 1","HARD_COPY","Author Name","Publication Name","Fiction,Adventure","Series Name",1,"A compelling story about...",10.50,15.99,5,"HARDCOVER",300,true,false
"Example Book 2","EBOOK","Author Name","Publication Name","Science,Education","","","Educational content summary",8.00,12.99,1,"",250,false,false
"Example Book 3","AUDIO","Another Author","Different Publisher","Mystery,Crime","Mystery Series",2.5,"Thrilling audiobook...",12.00,18.99,1,"",,true,false`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'books-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (parsedRows.length === 0) return

    setImporting(true)
    setProgress(0)
    setResult(null)

    try {
      // Import books (CSV already parsed on client)
      setProgress(30)
      const importResult = await bulkImportBooks(parsedRows)
      setProgress(100)

      setResult(importResult)

      if (importResult.success && importResult.failed === 0) {
        onSuccess?.()
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        // Show results tab even if there are errors
        setCurrentStep('result')
      }
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        failed: 1,
        errors: [{ row: 0, book: 'Unknown', error: error instanceof Error ? error.message : 'Failed to import books' }],
        created: { authors: 0, publications: 0, categories: 0, series: 0 },
      })
      setCurrentStep('result')
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setParsedRows([])
    setResult(null)
    setProgress(0)
    setCurrentStep('upload')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className='flex flex-col max-w-3xl overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>Bulk Import Books</SheetTitle>
          <SheetDescription>
            Import multiple books at once using a CSV file. New authors, publications, categories, and series will be created automatically.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 space-y-4'>
          <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="preview" disabled={!file}>Preview</TabsTrigger>
              <TabsTrigger value="result" disabled={!result}>Results</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Step 1: Download Template</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
                <p className="text-sm text-muted-foreground">
                  Download the template file to see the required format and example data.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Step 2: Upload CSV File</Label>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm text-muted-foreground">Drop the CSV file here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Drag & drop a CSV file here, or click to select</p>
                      <p className="text-xs text-muted-foreground">Supported: .csv files only</p>
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Tip:</strong> Multiple values can be comma-separated. For example:
                  Authors: "Author 1, Author 2" | Categories: "Fiction, Adventure"
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4 mt-4">
              {file && (
                <div className="space-y-4">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <div><strong>File:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)</div>
                        <div><strong>Books found:</strong> {parsedRows.length}</div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Ready to Import</Label>
                    <p className="text-sm text-muted-foreground">
                      Click "Import Books" to start the bulk import process. New entities will be created automatically if they don't exist.
                    </p>
                  </div>

                  {importing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Importing books...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  {result && (
                    <Alert variant={result.failed === 0 ? 'default' : 'destructive'}>
                      {result.failed === 0 ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        <div className="space-y-2">
                          <div>
                            <strong>Import Summary:</strong>
                          </div>
                          <ul className="text-sm space-y-1 list-disc list-inside">
                            <li>Successfully imported: {result.imported} books</li>
                            <li>Failed: {result.failed} books</li>
                            <li>Created authors: {result.created.authors}</li>
                            <li>Created publications: {result.created.publications}</li>
                            <li>Created categories: {result.created.categories}</li>
                            <li>Created series: {result.created.series}</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {result && result.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label>Errors ({result.errors.length})</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-2">
                        {result.errors.map((error, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">Row {error.row}:</span> {error.book} - {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="result" className="space-y-4 mt-4">
              {result && (
                <div className="space-y-4">
                  {result.failed === 0 ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Success!</strong> All {result.imported} books were imported successfully.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Import completed with errors.</strong> {result.imported} books imported, {result.failed} failed.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="text-xl font-bold">{result.imported}</div>
                      <div className="text-sm text-muted-foreground">Books Imported</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-xl font-bold">{result.failed}</div>
                      <div className="text-sm text-muted-foreground">Books Failed</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-xl font-bold">{result.created.authors}</div>
                      <div className="text-sm text-muted-foreground">New Authors</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-xl font-bold">{result.created.publications}</div>
                      <div className="text-sm text-muted-foreground">New Publications</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-xl font-bold">{result.created.categories}</div>
                      <div className="text-sm text-muted-foreground">New Categories</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-xl font-bold">{result.created.series}</div>
                      <div className="text-sm text-muted-foreground">New Series</div>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label>Failed Rows</Label>
                      <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-2">
                        {result.errors.map((error, idx) => (
                          <div key={idx} className="text-sm space-y-1">
                            <div>
                              <span className="font-medium">Row {error.row}:</span> {error.book}
                            </div>
                            <div className="text-muted-foreground text-xs">{error.error}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className='gap-2'>
          {currentStep === 'upload' && (
            <>
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button
                type="button"
                disabled={!file}
                onClick={() => setCurrentStep('preview')}
              >
                Next
              </Button>
            </>
          )}
          {currentStep === 'preview' && (
            <>
              <Button type="button" variant="outline" onClick={() => setCurrentStep('upload')} disabled={importing}>
                Back
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={importing || !!result || parsedRows.length === 0}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Books'
                )}
              </Button>
            </>
          )}
          {currentStep === 'result' && (
            <SheetClose asChild>
              <Button type="button">Close</Button>
            </SheetClose>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
