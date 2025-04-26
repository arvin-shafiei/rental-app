'use client';

import { useState, useRef } from 'react';
import { FileUp, Loader2 } from 'lucide-react';

interface ContractUploaderProps {
  onScanContract: (file: File) => void;
  isScanning: boolean;
}

export default function ContractUploader({ onScanContract, isScanning }: ContractUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    onScanContract(selectedFile);
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
          disabled={isScanning}
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
          onClick={handleUpload}
          disabled={!selectedFile || isScanning}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isScanning ? (
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
          disabled={!selectedFile || isScanning}
          className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
} 