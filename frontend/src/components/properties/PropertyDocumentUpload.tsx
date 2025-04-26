import { useState, useEffect, useRef } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface PropertyDocumentUploadProps {
  propertyId: string;
}

export default function PropertyDocumentUpload({ propertyId }: PropertyDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get the auth token
    async function getAuthToken() {
      const { data } = await supabase.auth.getSession();
      setAuthToken(data.session?.access_token || null);
    }

    getAuthToken();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null); // Clear previous upload results
    }
  };

  // Handle document type input
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (!authToken) {
      alert('You need to be logged in to upload files');
      return;
    }

    if (!documentType.trim()) {
      alert('Please select a document type');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('document', selectedFile);
      
      // Build the URL with query parameters for propertyId and documentType
      let uploadUrl = `/api/documents/upload?propertyId=${propertyId}&documentType=${encodeURIComponent(documentType.trim())}`;
      
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
        alert('Document uploaded successfully!');
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        alert(`Upload failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file reset
  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-8 pt-4 border-t">
      <div className="flex items-center mb-4">
        <FileUp className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold">Property Documents</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="mb-3">
          <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
            Document Type: <span className="text-red-500">*</span>
          </label>
          <select
            id="document-type"
            value={documentType}
            onChange={handleDocumentTypeChange}
            className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isUploading}
            required
          >
            <option value="">Select a document type</option>
            <option value="lease">Lease Agreement</option>
            <option value="inspection">Inspection Report</option>
            <option value="maintenance">Maintenance Record</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
            <option value="notice">Notice</option>
            <option value="communication">Communication</option>
            <option value="application">Rental Application</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        {/* File input */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Document:
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={!authToken || isUploading}
            className="block w-full mb-2 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.ppt,.pptx,.jpg,.jpeg,.png"
          />
          {selectedFile && (
            <div className="text-sm text-gray-500 mt-1">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
        </div>
        
        {/* Upload buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !authToken || isUploading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!selectedFile || isUploading}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Upload result */}
      {uploadResult && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2 text-green-700">Upload Successful!</h3>
          {uploadResult.data && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 mb-2">
                Document uploaded to: {documentType}
              </p>
              <p className="text-sm text-gray-600">
                Filename: {uploadResult.data.filename || uploadResult.data.originalName}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
