import React, { useState, useEffect } from 'react';
import { Mail, ImagePlus, Send, AlertCircle, Check, Loader2, Clock, MessageSquare, Wrench, ArrowDownCircle } from 'lucide-react';
import { sendDepositRequest, getDepositRequests, getPropertyImages, sendRepairRequest, getRepairRequests } from '@/lib/api';
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

interface Request {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  message: string;
  image_ids: string[];
  status: string;
  email_id?: string;
  landlord_email?: string;
  type?: string; // To differentiate between deposit and repair requests
}

interface PropertyLandlordContactProps {
  propertyId: string;
  propertyName: string;
  landlordEmail?: string;
  onEmailLimitError?: () => void;
  checkEmailLimit?: () => Promise<boolean>;
}

type RequestType = 'deposit' | 'repair';

export default function PropertyLandlordContact({ 
  propertyId, 
  propertyName,
  landlordEmail,
  onEmailLimitError,
  checkEmailLimit
}: PropertyLandlordContactProps) {
  const [message, setMessage] = useState('');
  // Use separate state for selections (by uniqueId) vs sending (by realId)
  const [selectedImageIds, setSelectedImageIds] = useState<Record<string, string>>({});
  const [availableImages, setAvailableImages] = useState<PropertyImage[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>('deposit');
  
  // Default deposit request template
  const defaultDepositMessage = `Dear Landlord,

I am writing to request the return of my security deposit for ${propertyName}. 

As per our tenancy agreement, my lease period is coming to an end, and I have ensured that the property is in good condition. I have thoroughly cleaned the premises and there are no damages beyond normal wear and tear.

Please let me know if you need to schedule a final inspection, or if you require any additional information.

Thank you for your attention to this matter.

Best regards,
[Your Name]`;

  // Default repair request template
  const defaultRepairMessage = `Dear Landlord,

I am writing to report an issue at ${propertyName} that requires repair.

Issue description:
[Describe the issue in detail - what's broken, when it started, how severe it is]

Location:
[Specify which room/area of the property]

Urgency:
[How urgent is this repair? Is it affecting daily living?]

Preferred access times:
[When are you available for maintenance visits?]

I have attached photos to help illustrate the issue. Please let me know when a repair can be scheduled.

Thank you for your prompt attention to this matter.

Best regards,
[Your Name]`;

  // Reset message to template based on current request type
  const resetMessage = () => {
    if (requestType === 'deposit') {
      setMessage(defaultDepositMessage);
    } else {
      setMessage(defaultRepairMessage);
    }
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
              const processedImages = room.images.map((img: any, index: number) => {
                const imageId = img.id || 
                               (img.filename ? `img_${img.filename.split('.')[0]}` : 
                               `img_${roomId}_${index}`);
                
                const processedImg = {
                  ...img,
                  // Ensure id exists
                  id: imageId,
                  // Create a unique ID combining the image id and room id
                  uniqueId: `${imageId}_${roomId}`,
                  url: img.url // Keep the existing URL if present
                    || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-images/${img.path}`
                };
                return processedImg;
              });
              images.push(...processedImages);
            }
          });
          setAvailableImages(images);
        } else {
          console.error("Failed to get images, response:", response);
        }
      } catch (err: any) {
        console.error('Error fetching property images:', err);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchImages();
  }, [propertyId]);

  // Fetch request history - either deposit or repair
  useEffect(() => {
    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        let response;
        if (requestType === 'deposit') {
          response = await getDepositRequests(propertyId);
        } else {
          response = await getRepairRequests(propertyId);
        }
        
        if (response.success && response.data) {
          // Add type information to distinguish source
          const typedRequests = response.data.map((req: any) => ({
            ...req,
            type: requestType
          }));
          setRequests(typedRequests);
        }
      } catch (err: any) {
        console.error(`Error fetching ${requestType} requests:`, err);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchRequests();
  }, [propertyId, requestType]);

  // Set default message on first load or when request type changes
  useEffect(() => {
    resetMessage();
  }, [propertyName, requestType]);

  // Toggle image selection using uniqueId
  const toggleImageSelection = (uniqueId: string, realId: string) => {
    setSelectedImageIds(prev => {
      // If this uniqueId is already selected, remove it
      if (prev[uniqueId]) {
        const newState = {...prev};
        delete newState[uniqueId];
        return newState;
      } 
      // Otherwise, add it
      const newState = {...prev, [uniqueId]: realId};
      return newState;
    });
  };

  // Submit request - either deposit or repair
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message to send to the landlord');
      return;
    }
    
    if (!landlordEmail) {
      setError('Landlord email is not set for this property. Please edit the property details.');
      return;
    }
    
    // Check email limit before sending
    if (checkEmailLimit) {
      const allowed = await checkEmailLimit();
      if (!allowed) {
        if (onEmailLimitError) {
          onEmailLimitError();
        }
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get the real image IDs from the selected map, filter out nulls
      const validImageIds = Object.values(selectedImageIds).filter(id => id !== null && id !== undefined);

      const requestData = {
        message,
        imageIds: validImageIds
      };

      let response;
      if (requestType === 'deposit') {
        response = await sendDepositRequest(propertyId, requestData);
      } else {
        response = await sendRepairRequest(propertyId, requestData);
      }
      
      if (response.success) {
        setSuccess(true);
        
        // Refresh request history
        let historyResponse;
        if (requestType === 'deposit') {
          historyResponse = await getDepositRequests(propertyId);
        } else {
          historyResponse = await getRepairRequests(propertyId);
        }
        
        if (historyResponse.success && historyResponse.data) {
          // Add type information
          const typedRequests = historyResponse.data.map((req: any) => ({
            ...req,
            type: requestType
          }));
          setRequests(typedRequests);
        }
        
        // Clear form
        resetMessage();
        setSelectedImageIds({});
      } else {
        throw new Error(response.message || `Failed to send ${requestType} request`);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending the request');
      console.error(`Error sending ${requestType} request:`, err);
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
      case 'in_progress':
        return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs flex items-center"><Wrench className="w-3 h-3 mr-1" /> In Progress</span>;
      case 'completed':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center"><Check className="w-3 h-3 mr-1" /> Completed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs flex items-center"><Clock className="w-3 h-3 mr-1" /> {status}</span>;
    }
  };

  // Get request type badge
  const getRequestTypeBadge = (type: string = 'deposit') => {
    if (type === 'repair') {
      return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs flex items-center"><Wrench className="w-3 h-3 mr-1" /> Repair</span>;
    }
    return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center"><ArrowDownCircle className="w-3 h-3 mr-1" /> Deposit</span>;
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-600">
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
          {/* Request type selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setRequestType('deposit')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  requestType === 'deposit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 inline mr-1" />
                Request Deposit Return
              </button>
              <button
                type="button"
                onClick={() => setRequestType('repair')}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  requestType === 'repair'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Wrench className="w-4 h-4 inline mr-1" />
                Request Repairs
              </button>
            </div>
          </div>
          
          <h3 className="font-medium text-lg mb-2 text-gray-600">
            {requestType === 'deposit' ? 'Request Deposit' : 'Request Repairs'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {requestType === 'deposit'
              ? 'Use this form to request the return of your security deposit from your landlord.'
              : 'Use this form to request repairs for issues at your property.'}
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
                    {requestType === 'deposit' ? 'Deposit request' : 'Repair request'} sent successfully to {landlordEmail}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-black mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={8}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm text-black border-gray-300 rounded-md"
                placeholder={`Enter your ${requestType} request message`}
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
                  {availableImages.map((image) => (
                    <div 
                      key={image.uniqueId}
                      className={`relative cursor-pointer rounded-md overflow-hidden border-2 ${
                        selectedImageIds[image.uniqueId] ? 'border-blue-500' : 'border-gray-200'
                      }`}
                      onClick={() => toggleImageSelection(image.uniqueId, image.id)}
                    >
                      <img 
                        src={image.url} 
                        alt="Property" 
                        className="h-24 w-full object-cover"
                      />
                      {selectedImageIds[image.uniqueId] && (
                        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                          <Check className="text-white w-6 h-6 drop-shadow-md" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                {Object.keys(selectedImageIds).length} image(s) selected
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !landlordEmail}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (loading || !landlordEmail) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send {requestType === 'deposit' ? 'Deposit Request' : 'Repair Request'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-medium text-lg mb-3 flex items-center text-gray-700">
          <span>Request History</span>
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {requestType === 'deposit' ? 'Deposit Requests' : 'Repair Requests'}
          </span>
        </h3>
        
        <div className="mb-4">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setRequestType('deposit')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                requestType === 'deposit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Deposit Requests
            </button>
            <button
              type="button"
              onClick={() => setRequestType('repair')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                requestType === 'repair'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Repair Requests
            </button>
          </div>
        </div>
        
        {requestsLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-md">
            No {requestType} requests have been sent yet.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map(request => (
              <div key={request.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-600">{format(new Date(request.created_at), 'MMMM d, yyyy')}</div>
                  <div className="flex space-x-2">
                    {getStatusBadge(request.status)}
                  </div>
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