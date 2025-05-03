import React, { useState, useEffect } from 'react';
import { Mail, ImagePlus, Send, AlertCircle, Check, Loader2, Clock, MessageSquare } from 'lucide-react';
import { sendDepositRequest, getDepositRequests, getPropertyImages } from '@/lib/api';
import { format } from 'date-fns';

interface PropertyImage {
  id: string;
  property_id: string;
  name: string;
  path: string;
  content_type: string;
  created_at: string;
  url: string;
  uniqueId: string;
}

interface DepositRequest {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  message: string;
  image_ids: string[];
  status: string;
  email_id?: string;
  landlord_email?: string;
}

interface PropertyLandlordContactProps {
  propertyId: string;
  propertyName: string;
  landlordEmail?: string;
}

export default function PropertyLandlordContact({ 
  propertyId, 
  propertyName,
  landlordEmail 
}: PropertyLandlordContactProps) {
  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [availableImages, setAvailableImages] = useState<PropertyImage[]>([]);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  
  // Default deposit request template
  const defaultDepositMessage = `Dear Landlord,

I am writing to request the return of my security deposit for ${propertyName}. 

As per our tenancy agreement, my lease period is coming to an end, and I have ensured that the property is in good condition. I have thoroughly cleaned the premises and there are no damages beyond normal wear and tear.

Please let me know if you need to schedule a final inspection, or if you require any additional information.

Thank you for your attention to this matter.

Best regards,
[Your Name]`;

  // Reset message to template
  const resetMessage = () => {
    setMessage(defaultDepositMessage);
  };

  // Fetch property images
  useEffect(() => {
    const fetchImages = async () => {
      setImagesLoading(true);
      try {
        const response = await getPropertyImages(propertyId);
        if (response.success && response.data) {
          // Flatten the room images structure and add URL property
          const images: PropertyImage[] = [];
          Object.entries(response.data).forEach(([roomId, room]: [string, any]) => {
            if (room.images && Array.isArray(room.images)) {
              // Map each image to include the URL and a uniqueId
              const processedImages = room.images.map((img: any) => ({
                ...img,
                // Create a unique ID combining the image id and room id
                uniqueId: `${img.id}_${roomId}`,
                url: img.url // Keep the existing URL if present
                  || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${img.path}`
              }));
              images.push(...processedImages);
            }
          });
          console.log("Processed images:", images);
          setAvailableImages(images);
        }
      } catch (err: any) {
        console.error('Error fetching property images:', err);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchImages();
  }, [propertyId]);

  // Fetch deposit request history
  useEffect(() => {
    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        const response = await getDepositRequests(propertyId);
        if (response.success && response.data) {
          setRequests(response.data);
        }
      } catch (err: any) {
        console.error('Error fetching deposit requests:', err);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchRequests();
  }, [propertyId]);

  // Set default message on first load
  useEffect(() => {
    resetMessage();
  }, [propertyName]);

  // Toggle image selection
  const toggleImageSelection = (uniqueId: string, realId: string) => {
    setSelectedImages(prev => 
      prev.includes(realId) 
        ? prev.filter(id => id !== realId) 
        : [...prev, realId]
    );
  };

  // Submit deposit request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate landlord email
      if (!landlordEmail) {
        throw new Error('Landlord email is not set for this property. Please edit the property details to add it.');
      }

      // Validate message
      if (!message.trim()) {
        throw new Error('Please enter a message to send to the landlord.');
      }

      // Filter out any null or undefined image IDs
      const validImageIds = selectedImages.filter(id => id !== null && id !== undefined);

      const requestData = {
        message,
        imageIds: validImageIds.length > 0 ? validImageIds : undefined
      };

      console.log('Sending deposit request with data:', requestData);
      const response = await sendDepositRequest(propertyId, requestData);
      
      if (response.success) {
        setSuccess(true);
        
        // Refresh request history
        const historyResponse = await getDepositRequests(propertyId);
        if (historyResponse.success && historyResponse.data) {
          setRequests(historyResponse.data);
        }
        
        // Clear form
        resetMessage();
        setSelectedImages([]);
      } else {
        throw new Error(response.message || 'Failed to send deposit request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending the request');
      console.error('Error sending deposit request:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center"><Send className="w-3 h-3 mr-1" /> Sent</span>;
      case 'replied':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center"><MessageSquare className="w-3 h-3 mr-1" /> Replied</span>;
      case 'completed':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center"><Check className="w-3 h-3 mr-1" /> Completed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center"><Clock className="w-3 h-3 mr-1" /> {status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-900">
          <Mail className="mr-2 h-5 w-5 text-blue-500" />
          Contact Landlord
        </h2>
        
        {!landlordEmail && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Landlord email is not set for this property. Please edit the property details to add it.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {landlordEmail && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Emails will be sent to: <strong>{landlordEmail}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <h3 className="font-medium text-lg mb-2">Request Deposit</h3>
          <p className="text-gray-600 text-sm mb-4">
            Use this form to request the return of your security deposit from your landlord.
          </p>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Deposit request sent successfully to {landlordEmail}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={8}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Enter your message to the landlord"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <div className="mt-1 text-right">
                <button
                  type="button"
                  onClick={resetMessage}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset to template
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImagePlus className="inline-block w-4 h-4 mr-1" />
                Attach Property Images (Optional)
              </label>
              
              {imagesLoading ? (
                <div className="flex items-center justify-center h-20 bg-gray-50 border border-gray-200 rounded">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : availableImages.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center text-gray-500">
                  No property images available. Upload images in the Images tab.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {availableImages.map(image => (
                    <div
                      key={image.uniqueId}
                      onClick={() => toggleImageSelection(image.uniqueId, image.id)}
                      className={`relative cursor-pointer border rounded-md overflow-hidden h-24 ${
                        selectedImages.includes(image.id) 
                          ? 'ring-2 ring-blue-500 border-blue-500' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedImages.includes(image.id) && (
                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-1 text-sm text-gray-500">
                {selectedImages.length > 0 
                  ? `${selectedImages.length} image${selectedImages.length !== 1 ? 's' : ''} selected` 
                  : 'Click on images to attach them to your request'}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !landlordEmail}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading || !landlordEmail 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Deposit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Request History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-lg mb-3">Request History</h3>
        
        {requestsLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
            No deposit requests have been sent yet.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{format(new Date(request.created_at), 'MMMM d, yyyy')}</div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{request.message}</div>
                {request.image_ids && request.image_ids.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {request.image_ids.length} image{request.image_ids.length !== 1 ? 's' : ''} attached
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 