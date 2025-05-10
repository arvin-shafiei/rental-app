import { useState, useEffect, useRef } from 'react';
import { FileUp, Loader2, File, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertyDocumentUploadProps {
  propertyId: string;
  onDocumentUploaded?: () => void;
}

// List of common document types
const documentTypes = [
  "Rental Contract",
  "Inspection Report",
  "Maintenance Record",
  "Invoice",
  "Receipt",
  "Notice",
  "Communication",
  "Other"
];

export default function PropertyDocumentUpload({ propertyId, onDocumentUploaded }: PropertyDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [documentType, setDocumentType] = useState<string>('rental-contract');
  const [customType, setCustomType] = useState<string>('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get the auth token
    async function getAuthToken() {
      const { data } = await supabase.auth.getSession();
      setAuthToken(data.session?.access_token || null);
    }

    getAuthToken();
  }, []);

  // Automatically upload when a file is selected
  useEffect(() => {
    if (selectedFile && getFinalDocumentType() && authToken && !isUploading) {
      handleUpload();
    }
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setShowSuccess(false);
      setError(null);
    }
  };

  // Handle document type selection
  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    setError(null);
    
    // Clear custom type if a pre-defined type is selected
    if (value !== 'other') {
      setCustomType('');
    }
    
    // Clear file selection when document type changes
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedFile(null);
  };
  
  // Handle custom document type input
  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomType(e.target.value);
    setError(null);
  };

  // Handle drag events for drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // First check if we have a document type selected
    if (!getFinalDocumentType()) {
      setError("Please select a document type before uploading");
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setUploadResult(null);
      setShowSuccess(false);
      setError(null);
    }
  };

  // Activate file input when clicking on drop area
  const activateFileInput = () => {
    // Check if document type is selected first
    if (!getFinalDocumentType()) {
      setError("Please select a document type before uploading");
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Get the final document type (either from dropdown or custom input)
  const getFinalDocumentType = (): string => {
    if (documentType === 'other' && customType.trim()) {
      return customType.trim();
    }
    return documentType;
  };

  // Handle file upload
  const handleUpload = async () => {
    const finalDocumentType = getFinalDocumentType();
    
    if (!selectedFile) {
      setError("No file selected");
      return;
    }

    if (!authToken) {
      setError("You need to be logged in to upload files");
      return;
    }

    if (!finalDocumentType) {
      setError("Please select a document type");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('document', selectedFile);
      
      // Build the URL with query parameters for propertyId and documentType
      let uploadUrl = `/api/documents/upload?propertyId=${propertyId}&documentType=${encodeURIComponent(finalDocumentType.toLowerCase().replace(/ /g, '-'))}`;
      
      // Make the request to the frontend API route
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        setShowSuccess(true);
        
        // Reset form for next upload
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
        
        // Notify parent component about successful upload to refresh document list
        if (onDocumentUploaded) {
          onDocumentUploaded();
        }
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        setError(errorData.message || "Upload failed");
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file reset
  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setShowSuccess(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pt-2 mb-12">
      <div className="flex items-center mb-4">
        <FileUp className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-700">Property Documents</h3>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Document type selection */}
        <div className="p-4 border-b border-gray-100">
          <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1.5">
            Document Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={documentType}
            onValueChange={handleDocumentTypeChange}
            disabled={isUploading}
            defaultValue="rental-contract"
          >
            <SelectTrigger className="w-full bg-white text-gray-900">
              <SelectValue placeholder="Select document type..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {documentTypes.map((type) => (
                <SelectItem 
                  key={type} 
                  value={type.toLowerCase().replace(/ /g, '-')}
                  className="text-gray-900"
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {documentType === 'other' && (
            <div className="mt-2">
              <label htmlFor="custom-type" className="block text-sm font-medium text-gray-700 mb-1.5">
                Specify Document Type <span className="text-red-500">*</span>
              </label>
              <input
                id="custom-type"
                type="text"
                value={customType}
                onChange={handleCustomTypeChange}
                placeholder="Describe your document (e.g., Utility Bill, Contract Amendment)"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isUploading}
              />
            </div>
          )}
          
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
        
        {/* Drag & drop area */}
        <div 
          ref={dropAreaRef}
          className={`p-6 flex flex-col items-center justify-center border-dashed border-2 rounded-md m-4 cursor-pointer transition-colors ${
            !getFinalDocumentType() ? 'border-gray-200 bg-gray-50 cursor-not-allowed' :
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onClick={activateFileInput}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          >
            {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-gray-600">Uploading document...</p>
            </div>
          ) : !getFinalDocumentType() ? (
            <div className="text-center">
              <File className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Please select a document type first</p>
            </div>
            ) : (
              <>
              <div className="flex items-center justify-center mb-2">
                <File className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-center mb-2">
                Drag & drop any file here, or click to select
              </p>
              <p className="text-xs text-gray-400 italic">
                All file types supported. File will be uploaded automatically when selected.
              </p>
              </>
            )}
        </div>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
          disabled={isUploading || !getFinalDocumentType()}
        />
      </div>
      
      {/* Success message toast */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md shadow-lg flex items-center z-50 animate-slideInUp">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <p>Successfully uploaded <strong>{uploadResult?.data?.originalName || 'document'}</strong></p>
        </div>
      )}
    </div>
  );
}
