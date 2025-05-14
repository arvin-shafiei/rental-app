import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, Camera, X, Image as ImageIcon, Info, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toast } from "@/components/ui/FormElements";
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface PropertyImageUploadProps {
  propertyId: string;
}

// List of common room types in a property
const roomOptions = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Bathroom",
  "Hallway",
  "Dining Room",
  "Office",
  "Garden",
  "Balcony",
  "Exterior"
];

export default function PropertyImageUpload({ propertyId }: PropertyImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [customRoom, setCustomRoom] = useState<string>('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showLimitError, setShowLimitError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);

  // Get the auth token
  const getAuthToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || null;
    setAuthToken(token);
    return token;
  };

  useEffect(() => {
    // Get the auth token
    getAuthToken();
  }, []);

  // Create preview when file is selected
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setIsVideo(selectedFile.type.startsWith('video/'));
      
      // Cleanup function to revoke the URL when no longer needed
      return () => URL.revokeObjectURL(url);
    }
    
    return undefined;
  }, [selectedFile]);

  // Auto-upload when a file is selected and room is chosen
  useEffect(() => {
    if (selectedFile && roomName && authToken && !isUploading) {
      handleUpload();
    }
  }, [selectedFile, roomName]);

  // Check if user has reached image limit
  const checkImageLimit = async (): Promise<boolean> => {
    try {
      let token = authToken;
      
      if (!token) {
        // Try to refresh the token first
        const { data: refreshData } = await supabase.auth.refreshSession();
        token = refreshData?.session?.access_token || null;
        if (token) {
          setAuthToken(token);
        } else {
          console.error('No auth token available');
          return false; // Don't allow upload if no auth token
        }
      }
      
      const response = await fetch(`/api/stripe/check-limits?feature=images`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error(`Check limit failed with status: ${response.status}`);
        
        // For 401/auth errors, try refreshing the token and retry
        if (response.status === 401) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData?.session?.access_token) {
            token = refreshData.session.access_token;
            setAuthToken(token);
            
            const retryResponse = await fetch(`/api/stripe/check-limits?feature=images`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              return retryResult.allowed;
            }
            
            // If retry after token refresh still fails, don't allow upload
            console.error('Token refresh succeeded but limit check still failed');
            return false;
          }
          
          console.error('Failed to refresh token');
          return false;
        }
        
        // For other errors, be cautious and don't allow upload
        return false;
      }
      
      const result = await response.json();
      console.log('Limit check result:', result);
      
      return result.allowed;
    } catch (error) {
      console.error('Error checking image limits:', error);
      return false; // Don't allow upload if check fails
    }
  };

  // Handle file selection from input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Check limits before processing the file
      const allowed = await checkImageLimit();
      
      if (!allowed) {
        setShowLimitError(true);
        return;
      }
      
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setShowSuccess(false);
    }
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
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Check limits before processing the dropped file
    const allowed = await checkImageLimit();
    
    if (!allowed) {
      setShowLimitError(true);
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      // Check if file is image or video
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
        setUploadResult(null);
        setShowSuccess(false);
      }
    }
  };

  // Handle room selection
  const handleRoomChange = (value: string) => {
    setRoomName(value);
    
    // Clear custom room if a pre-defined room is selected
    if (value !== 'other') {
      setCustomRoom('');
    }
  };

  // Handle custom room name input
  const handleCustomRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomRoom(e.target.value);
  };

  // Activate file input when clicking on drop area
  const activateFileInput = async () => {
    // Check limits before opening file picker
    const allowed = await checkImageLimit();
    
    if (!allowed) {
      setShowLimitError(true);
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Activate camera/video recording
  const activateCamera = async () => {
    // Check limits before opening camera
    const allowed = await checkImageLimit();
    
    if (!allowed) {
      setShowLimitError(true);
      return;
    }
    
    if (videoRef.current) {
      videoRef.current.click();
    }
  };

  // Get the final room name (either from dropdown or custom input)
  const getFinalRoomName = (): string => {
    if (roomName === 'other' && customRoom.trim()) {
      return customRoom.trim();
    }
    return roomName;
  };

  // Handle file upload
  const handleUpload = async () => {
    const finalRoomName = getFinalRoomName();
    
    if (!selectedFile) {
      return;
    }

    let token = authToken;
    if (!token) {
      // Try to refresh the token
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData?.session?.access_token) {
        token = refreshData.session.access_token || null;
        setAuthToken(token);
      } else {
        console.error('No auth token available');
        setError('Authentication required. Please refresh the page and try again.');
        return;
      }
    }

    if (!finalRoomName) {
      return;
    }
    
    // Check limits before uploading
    const allowed = await checkImageLimit();
    
    if (!allowed) {
      setShowLimitError(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Build the URL with query parameters for propertyId and roomName
      let uploadUrl = `/api/upload/image?propertyId=${propertyId}&roomName=${encodeURIComponent(finalRoomName)}`;
      
      console.log('Sending upload request with token', token?.substring(0, 10) + '...');
      
      // Make the request to the frontend API route
      let response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      // Handle authentication issues
      if (response.status === 401) {
        console.log('Received 401, refreshing token and retrying...');
        
        // Try refreshing the token and retrying once
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session?.access_token) {
          token = refreshData.session.access_token;
          setAuthToken(token);
          
          console.log('Retrying with new token', token?.substring(0, 10) + '...');
          
          // Clone the FormData since the original might have been consumed
          const newFormData = new FormData();
          newFormData.append('image', selectedFile);
          
          response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: newFormData
          });
          
          // If still failing after token refresh
          if (response.status === 401) {
            console.error('Still unauthorized after token refresh');
            setError('Authentication failed. Please try logging in again.');
            setIsUploading(false);
            return;
          }
        } else {
          console.error('Failed to refresh token');
          setError('Authentication failed. Please try logging in again.');
          setIsUploading(false);
          return;
        }
      }
      
      // Process the response
      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        setShowSuccess(true);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        console.error('Upload failed with status:', response.status);
        try {
          const errorData = await response.json();
          console.error('Upload error details:', errorData);
          
          // Check if this is a limit error
          if (errorData.code === 'limit_exceeded') {
            setShowLimitError(true);
          } else {
            setError(errorData.error || 'Upload failed. Please try again later.');
          }
        } catch (e) {
          console.error('Could not parse error response', e);
          setError('Upload failed. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file reset
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadResult(null);
    setShowSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pt-1 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Upload className="w-5 h-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-700">Document Property Condition</h3>
        </div>
      </div>
      
      <Alert className="mb-3 bg-blue-50 text-blue-800 border-blue-200 py-2">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-sm">
          Record the current condition of your property with photos and videos to protect your security deposit.
        </AlertDescription>
      </Alert>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Room selection */}
        <div className="p-3 border-b border-gray-100">
          <label htmlFor="room-select" className="block text-sm font-medium text-gray-700 mb-1">
            Choose a Room
          </label>
          <Select
            value={roomName}
            onValueChange={handleRoomChange}
            disabled={isUploading}
          >
            <SelectTrigger className="w-full font-medium">
              <SelectValue 
                placeholder="Select a room..." 
                className="text-gray-900"
              />
            </SelectTrigger>
            <SelectContent>
              {roomOptions.map((room) => (
                <SelectItem 
                  key={room} 
                  value={room.toLowerCase().replace(' ', '-')}
                >
                  {room}
                </SelectItem>
              ))}
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          {roomName === 'other' && (
            <div className="mt-2">
              <label htmlFor="custom-room" className="block text-sm font-medium text-gray-700 mb-1">
                Other Room Name
              </label>
              <input
                id="custom-room"
                type="text"
                value={customRoom}
                onChange={handleCustomRoomChange}
                placeholder="Enter room name"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                disabled={isUploading}
              />
            </div>
          )}
        </div>
        
        {/* Drag & drop area */}
        <div 
          ref={dropAreaRef}
          className={`p-4 flex flex-col items-center justify-center border-dashed border-2 rounded-md mx-3 my-3 cursor-pointer transition-colors ${
            !roomName ? 'border-gray-200 bg-gray-50 cursor-not-allowed' :
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onClick={roomName ? activateFileInput : undefined}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!roomName ? (
            <div className="text-center">
              <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400">Please select a room first</p>
            </div>
          ) : isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-gray-600">Uploading media...</p>
            </div>
          ) : !selectedFile ? (
            <>
              <div className="flex items-center justify-center mb-2">
                <ImageIcon className="w-7 h-7 text-gray-400 mr-2" />
                <Camera className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-500 text-center mb-2">
                Drag & drop an image or video here, or click to select
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button" 
                  className="py-1 px-3 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    activateFileInput();
                  }}
                >
                  Choose File
                </button>
                
                <button
                  type="button" 
                  className="py-1 px-3 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    activateCamera();
                  }}
                >
                  <Camera className="w-3.5 h-3.5 inline-block mr-1" />
                  Record
                </button>
              </div>
            </>
          ) : (
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Preview</span>
                <div className="flex">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (previewUrl) {
                        const a = document.createElement('a');
                        a.href = previewUrl;
                        a.download = selectedFile.name;
                        a.click();
                      }
                    }}
                    className="p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 mr-1"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-center overflow-hidden rounded-md max-h-48 bg-gray-50 mt-1">
                {isVideo ? (
                  <video 
                    src={previewUrl || ''}
                    controls
                    className="max-h-48 max-w-full object-contain"
                  />
                ) : (
                  <img 
                    src={previewUrl || ''} 
                    alt="Preview" 
                    className="max-h-48 max-w-full object-contain"
                  />
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span className="truncate max-w-[70%]">{selectedFile.name}</span>
                <span>{Math.round(selectedFile.size / 1024)} KB</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
        disabled={isUploading || !roomName}
      />
      
      <input
        type="file"
        ref={videoRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/*"
        capture="environment"
        disabled={isUploading || !roomName}
      />
      
      {/* Success message toast */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md shadow-lg flex items-center z-50 animate-slideInUp">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <p>Successfully uploaded to <strong>{uploadResult?.data?.roomName.replace(/-/g, ' ')}</strong></p>
        </div>
      )}
      
      {/* Limit exceeded toast with link to billing */}
      <Toast 
        title="Image Limit Reached"
        description={
          <div>
            You've reached your image upload limit. 
            <Link 
              href="/dashboard/settings/billing" 
              className="ml-1 text-blue-600 hover:text-blue-800 underline"
            >
              Upgrade your plan
            </Link> to upload more images.
          </div>
        }
        variant="destructive"
        visible={showLimitError}
        onClose={() => setShowLimitError(false)}
      />
      
      {/* Error message toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-lg flex items-center z-50 animate-slideInUp">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 