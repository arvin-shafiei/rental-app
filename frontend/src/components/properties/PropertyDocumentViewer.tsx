import { useState, useEffect } from 'react';
import { FileText, Loader2, Folder, X, Download, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { getPropertyDocuments, deletePropertyDocument } from '@/lib/api';

interface PropertyDocumentViewerProps {
  propertyId: string;
}

export default function PropertyDocumentViewer({ propertyId }: PropertyDocumentViewerProps) {
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{show: boolean; path: string; name: string} | null>(null);
  
  const fetchPropertyDocuments = async () => {
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
  };

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDocuments();
    }
  }, [propertyId]);
  
  const handleDeleteClick = (documentPath: string, documentName: string) => {
    setShowDeleteConfirm({
      show: true,
      path: documentPath,
      name: documentName
    });
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };
  
  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      setIsDeleting(true);
      await deletePropertyDocument(showDeleteConfirm.path);
      
      // Refresh document list after deletion
      const result = await getPropertyDocuments(propertyId);
      if (result.success && result.data) {
        const sortedDocTypes = [...result.data].sort((a, b) => 
          a.documentType.localeCompare(b.documentType)
        );
        setDocumentTypes(sortedDocTypes);
      }
      
      // Show success message
      setDeleteSuccess(`"${showDeleteConfirm.name}" was deleted successfully`);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(`Failed to delete document: ${error instanceof Error ? error.message : String(error)}`);
      
      // Hide error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
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

  // Format document type for display
  const formatDocumentType = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-gray-600 text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
        <p className="text-sm">Error loading documents: {error}</p>
      </div>
    );
  }

  if (documentTypes.length === 0) {
    return (
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <h3 className="text-lg font-medium text-gray-900">No Documents</h3>
        <p className="mt-2 text-gray-500 max-w-md mx-auto">
          You haven't uploaded any documents for this property yet. Use the form above to add documents.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Document</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-medium text-gray-900">"{showDeleteConfirm.name}"</span>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-70 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {deleteSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md shadow-lg flex items-center z-50 animate-slideInUp">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <p>{deleteSuccess}</p>
        </div>
      )}

      {documentTypes.map((docType, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
            <Folder className="h-5 w-5 mr-2 text-blue-600" />
              <h3 className="text-md font-medium text-gray-800">
                {formatDocumentType(docType.documentType)}
          </h3>
            </div>
          </div>
          
          {!docType.documents || docType.documents.length === 0 ? (
            <div className="p-4 text-center text-gray-500 italic text-sm">
              No documents in this category
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
                {docType.documents.map((document: any, docIndex: number) => {
                  const filename = document.filename;
                  
                  return (
                  <div 
                      key={docIndex}
                    className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 gap-x-4">
                          {getFileIcon(filename)}
                          <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900 truncate">
                              {filename}
                            </p>
                          <p className="mt-1 flex flex-wrap items-center text-xs leading-5 text-gray-500">
                              {document.metadata && (
                              <span className="mr-3">{formatFileSize(document.metadata.size)}</span>
                              )}
                              {document.created_at && (
                              <span className="flex items-center">
                                <span className="h-1 w-1 rounded-full bg-gray-400 mr-1.5"></span>
                                  Uploaded on {new Date(document.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      <div className="flex items-center space-x-2">
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                            title="View Document"
                          >
                            <ExternalLink className="h-5 w-5" />
                            <span className="sr-only">View</span>
                          </a>
                          <a
                            href={document.url}
                            download={filename}
                          className="text-gray-400 hover:text-green-600 p-1.5 rounded-full hover:bg-green-50 transition-colors"
                            title="Download Document"
                          >
                            <Download className="h-5 w-5" />
                            <span className="sr-only">Download</span>
                          </a>
                          <button
                          onClick={() => handleDeleteClick(document.path, filename)}
                            disabled={isDeleting}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Delete Document"
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </div>
                  </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}