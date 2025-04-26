import { useState, useEffect } from 'react';
import { Image, Loader2, Home, X, Trash2 } from 'lucide-react';
import { getPropertyImages, deletePropertyImage } from '@/lib/api';

interface PropertyImageViewerProps {
  propertyId: string;
}

export default function PropertyImageViewer({ propertyId }: PropertyImageViewerProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fetchPropertyImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching property images for property:', propertyId);
      const result = await getPropertyImages(propertyId);
      console.log('Property images API response:', result);
      
      if (result.success && result.data) {
        // Sort rooms by name for consistent display
        const sortedRooms = [...result.data].sort((a, b) => 
          a.roomName.localeCompare(b.roomName)
        );
        setRooms(sortedRooms);
      } else {
        setError('Failed to load property images');
      }
    } catch (error) {
      console.error('Error fetching property images:', error);
      setError(error instanceof Error ? error.message : 'Failed to load property images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchPropertyImages();
    }
  }, [propertyId]);
  
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };
  
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleDeleteImage = async (e: React.MouseEvent, imagePath: string) => {
    e.stopPropagation(); // Prevent image modal from opening
    
    if (isDeleting) return; // Prevent multiple clicks
    
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setError(null);
      
      await deletePropertyImage(propertyId, imagePath);
      
      // Refresh the images after deletion
      await fetchPropertyImages();
      
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete image');
    } finally {
      setIsDeleting(false);
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
        <p>Error: {error}</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
        <Image className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Images</h3>
        <p className="mt-1 text-sm text-gray-500">Upload images using the form above.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-screen p-4">
            <button 
              className="absolute top-0 right-0 bg-white rounded-full p-2 m-2 text-gray-800 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size" 
              className="max-h-screen object-contain" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {rooms.map((room, index) => (
        <div key={index} className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Home className="h-5 w-5 mr-2 text-blue-600" />
            {room.roomName.charAt(0).toUpperCase() + room.roomName.slice(1).replace(/-/g, ' ')}
          </h3>
          
          {!room.images || room.images.length === 0 ? (
            <p className="text-gray-500 italic">No images in this room</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {room.images.map((image: any, imgIndex: number) => {
                // Create a direct reference to the image URL and path
                const imageUrl = image.url;
                const imagePath = image.path;
                
                return (
                  <div 
                    key={imgIndex} 
                    className="relative overflow-hidden rounded-lg shadow-sm border border-gray-200 aspect-square cursor-pointer hover:shadow-md transition-shadow bg-gray-100 flex items-center justify-center group"
                    onClick={() => openImageModal(imageUrl)}
                  >
                    {/* Delete button overlay - show on hover */}
                    <button
                      className="absolute top-2 right-2 bg-red-100 hover:bg-red-600 hover:text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-40"
                      onClick={(e) => handleDeleteImage(e, imagePath)}
                      disabled={isDeleting}
                      title="Delete image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    {/* Simple image display with fallback */}
                    <div className="w-full h-full">
                      {/* Loading spinner - shown until image loads */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                      
                      {/* The image itself */}
                      <img 
                        src={imageUrl}
                        alt={`${room.roomName} image ${imgIndex + 1}`}
                        className="w-full h-full object-cover z-20"
                        onLoad={(e) => {
                          // Hide the loading spinner when image loads
                          const img = e.target as HTMLImageElement;
                          const container = img.closest('div.relative');
                          if (container) {
                            const spinner = container.querySelector('div.absolute');
                            if (spinner instanceof HTMLElement) {
                              spinner.style.display = 'none';
                            }
                          }
                        }}
                        onError={(e) => {
                          // Show error state if image fails to load
                          console.error(`Failed to load image: ${imageUrl}`);
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          
                          const container = img.closest('div.relative');
                          if (container) {
                            const spinner = container.querySelector('div.absolute');
                            if (spinner instanceof HTMLElement) {
                              spinner.innerHTML = '<div class="p-2 text-red-500 text-xs text-center">Image failed to load</div>';
                            }
                          }
                        }}
                      />
                      
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-black opacity-0 hover:opacity-25 transition-opacity flex items-center justify-center z-30">
                        <Image className="h-8 w-8 text-white" />
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