import { useState, useEffect } from 'react';
import { FileText, Loader2, Folder, X, Download, ExternalLink, Trash2 } from 'lucide-react';
import { getPropertyDocuments, deletePropertyDocument } from '@/lib/api';

interface PropertyDocumentViewerProps {
  propertyId: string;
}

export default function PropertyDocumentViewer({ propertyId }: PropertyDocumentViewerProps) {
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    async function fetchPropertyDocuments() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching property documents for property:', propertyId);
        const result = await getPropertyDocuments(propertyId);
        console.log('Property documents API response:', result);
        
        if (result.success && result.data) {
          // Sort document types alphabetically
          const sortedDocTypes = [...result.data].sort((a, b) => 
            a.documentType.localeCompare(b.documentType)
          );
          setDocumentTypes(sortedDocTypes);
        } else {
          setError('Failed to load property documents');
        }
      } catch (error) {
        console.error('Error fetching property documents:', error);
        setError(error instanceof Error ? error.message : 'Failed to load property documents');
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) {
      fetchPropertyDocuments();
    }
  }, [propertyId]);
  
  const handleDeleteDocument = async (documentPath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await deletePropertyDocument(documentPath);
      
      // Refresh document list after deletion
      const result = await getPropertyDocuments(propertyId);
      if (result.success && result.data) {
        const sortedDocTypes = [...result.data].sort((a, b) => 
          a.documentType.localeCompare(b.documentType)
        );
        setDocumentTypes(sortedDocTypes);
      }
      
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to format document size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get file icon based on file type
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-blue-700" />;
    } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-green-600" />;
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-orange-500" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="mt-6 flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error loading documents: {error}</p>
      </div>
    );
  }

  if (documentTypes.length === 0) {
    return (
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Documents</h3>
        <p className="mt-1 text-sm text-gray-500">Upload documents using the form above.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {documentTypes.map((docType, index) => (
        <div key={index} className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-blue-600" />
            {docType.documentType.charAt(0).toUpperCase() + docType.documentType.slice(1).replace(/-/g, ' ')}
          </h3>
          
          {!docType.documents || docType.documents.length === 0 ? (
            <p className="text-gray-500 italic">No documents in this category</p>
          ) : (
            <div className="overflow-hidden bg-white border border-gray-200 rounded-md">
              <ul className="divide-y divide-gray-200">
                {docType.documents.map((document: any, docIndex: number) => {
                  const filename = document.filename;
                  
                  return (
                    <li 
                      key={docIndex}
                      className="p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 gap-x-4">
                          {getFileIcon(filename)}
                          <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900 truncate">
                              {filename}
                            </p>
                            <p className="mt-1 flex items-center text-xs leading-5 text-gray-500">
                              {document.metadata && (
                                <span>{formatFileSize(document.metadata.size)}</span>
                              )}
                              {document.created_at && (
                                <span className="ml-2 border-l border-gray-200 pl-2">
                                  Uploaded on {new Date(document.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-x-2">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                            title="View Document"
                          >
                            <ExternalLink className="h-5 w-5" />
                            <span className="sr-only">View</span>
                          </a>
                          <a
                            href={document.url}
                            download={filename}
                            className="text-green-600 hover:text-green-800"
                            title="Download Document"
                          >
                            <Download className="h-5 w-5" />
                            <span className="sr-only">Download</span>
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(document.path)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Delete Document"
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}