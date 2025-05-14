'use client';

import { useState, useRef } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

interface ContractUploaderProps {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onScanStart?: () => void;
  onLimitExceeded?: () => void;
  checkSummariesLimit?: () => Promise<boolean>;
}

export default function ContractUploader({ 
  onSuccess, 
  onError, 
  onScanStart,
  onLimitExceeded,
  checkSummariesLimit
}: ContractUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select a file to scan');
      return;
    }
    
    if (checkSummariesLimit) {
      const allowed = await checkSummariesLimit();
      if (!allowed) {
        if (onLimitExceeded) {
          onLimitExceeded();
        }
        return;
      }
    }
    
    setScanning(true);
    setError(null);
    
    if (onScanStart) {
      onScanStart();
    }
    
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      
      const response = await fetch('/api/contracts/scan', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.code === 'limit_exceeded') {
          if (onLimitExceeded) {
            onLimitExceeded();
          }
          return;
        }
        
        throw new Error(errorData.error || 'Failed to scan contract');
      }
      
      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data.data);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      
    } catch (err: any) {
      console.error('Error scanning contract:', err);
      const errorMessage = err.message || 'An error occurred during scanning';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Contract File:
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={scanning}
          className="block w-full mb-2 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          accept=".pdf,.doc,.docx,.txt"
        />
        {selectedFile && (
          <div className="text-sm text-gray-500 mt-1">
            Selected: {selectedFile.name}
          </div>
        )}
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={handleScan}
          disabled={!selectedFile || scanning}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4 inline mr-2" />
              Scan Contract
            </>
          )}
        </button>
        
        <button
          onClick={handleReset}
          disabled={!selectedFile || scanning}
          className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
} 