import { useState, useEffect } from 'react';
import { Image, Loader2, Home, X, Trash2, Camera } from 'lucide-react';
import { getPropertyImages, deletePropertyImage } from '@/lib/api';

interface PropertyImageViewerProps {
  propertyId: string;
}

interface RoomData {
  roomName: string;
  images: {
    url: string;
    path: string;
    type: 'image' | 'video';
  }[];
}

interface ApiRoomData {
  roomName: string;
  images: {
    url: string;
    path: string;
  }[];
}

export default function PropertyImageViewer({ propertyId }: PropertyImageViewerProps) {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const fetchPropertyImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getPropertyImages(propertyId);
      
      if (result.success && result.data) {
        // Process the data to identify videos
        const processedRooms = result.data.map((room: ApiRoomData) => {
          const processedImages = room.images.map((image: { url: string, path: string }) => ({
            ...image,
            type: image.url.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'image'
          }));
          
          return {
            ...room,
            images: processedImages
          };
        });
        
        // Sort rooms by name for consistent display
        const sortedRooms = [...processedRooms].sort((a, b) => 
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
  
  const openMediaModal = (mediaUrl: string, isVideoFile: boolean) => {
    setSelectedMedia(mediaUrl);
    setIsVideo(isVideoFile);
  };
  
  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

  const handleDeleteMedia = async (e: React.MouseEvent, imagePath: string) => {
    e.stopPropagation(); // Prevent modal from opening
    
    if (isDeleting) return; // Prevent multiple clicks
    
    // Remove confirming dialog for better UX
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

  const formatRoomName = (name: string): string => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading media...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="text-sm">Error: {error}</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
        <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Media</h3>
        <p className="mt-1 text-sm text-gray-500">Start by uploading images or videos above.</p>
      </div>
    );
  }

  // Split rooms into single-item and multi-item collections
  const singleItemRooms = rooms.filter(room => room.images.length === 1);
  const multiItemRooms = rooms.filter(room => room.images.length > 1);

  return (
    <div>
      {/* Media Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" 
          onClick={closeMediaModal}
        >
          <div className="relative max-w-4xl max-h-screen">
            <button 
              className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full p-1.5 text-white hover:bg-opacity-100 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                closeMediaModal();
              }}
            >
              <X className="h-5 w-5" />
            </button>
            
            {isVideo ? (
              <video 
                src={selectedMedia} 
                controls
                autoPlay
                className="max-h-screen max-w-full object-contain" 
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
            <img 
                src={selectedMedia} 
              alt="Full size" 
                className="max-h-screen max-w-full object-contain" 
              onClick={(e) => e.stopPropagation()}
            />
            )}
          </div>
        </div>
      )}

      {/* Single Item Rooms - Displayed side by side */}
      {singleItemRooms.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {singleItemRooms.map((room) => (
              <div key={room.roomName} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm h-full flex flex-col">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <Home className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                    <h3 className="text-sm font-medium text-gray-800">
                      {formatRoomName(room.roomName)}
          </h3>
                  </div>
                </div>
                
                <div className="p-2 flex-grow">
                  {room.images.map((media, imgIndex) => (
                    <div 
                      key={imgIndex} 
                      className="relative rounded-md overflow-hidden bg-gray-100 aspect-square cursor-pointer hover:opacity-95 transition-opacity h-full"
                      onClick={() => openMediaModal(media.url, media.type === 'video')}
                    >
                      {/* Delete button */}
                      <button
                        className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 z-20 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-red-600 transition-all"
                        onClick={(e) => handleDeleteMedia(e, media.path)}
                        disabled={isDeleting}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      
                      {/* Video indicator */}
                      {media.type === 'video' && (
                        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 z-10">
                          <Camera className="h-3.5 w-3.5" />
                        </div>
                      )}
                      
                      {/* Loading state */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                      
                      {/* Media preview */}
                      {media.type === 'video' ? (
                        <video 
                          src={media.url}
                          className="absolute inset-0 w-full h-full object-cover z-20"
                          onLoadedData={(e) => {
                            const video = e.target as HTMLVideoElement;
                            const container = video.closest('div.relative');
                            if (container) {
                              const spinner = container.querySelector('div.absolute');
                              if (spinner instanceof HTMLElement) {
                                spinner.style.display = 'none';
                              }
                            }
                          }}
                        />
                      ) : (
                        <img 
                          src={media.url}
                          alt={`${room.roomName} ${imgIndex + 1}`}
                          className="absolute inset-0 w-full h-full object-cover z-20"
                          onLoad={(e) => {
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
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            
                            const container = img.closest('div.relative');
                            if (container) {
                              const spinner = container.querySelector('div.absolute');
                              if (spinner instanceof HTMLElement) {
                                spinner.innerHTML = '<div class="p-2 text-red-500 text-xs text-center">Failed to load</div>';
                              }
                            }
                          }}
                        />
                      )}
                        
                      {/* Play button for videos */}
                      {media.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Item Rooms - Stacked view */}
      {multiItemRooms.length > 0 && (
        <div className="space-y-6">
          {multiItemRooms.map((room) => (
            <div key={room.roomName} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <Home className="h-4 w-4 mr-2 text-blue-600" />
                  <h3 className="text-md font-medium text-gray-800">
                    {formatRoomName(room.roomName)}
                  </h3>
                </div>
              </div>
            
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {room.images.map((media, imgIndex) => (
                  <div 
                    key={imgIndex} 
                    className="relative rounded-md overflow-hidden bg-gray-100 aspect-square cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => openMediaModal(media.url, media.type === 'video')}
                  >
                    {/* Delete button */}
                    <button
                      className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 z-20 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-red-600 transition-all"
                      onClick={(e) => handleDeleteMedia(e, media.path)}
                      disabled={isDeleting}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    
                    {/* Video indicator */}
                    {media.type === 'video' && (
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white rounded-full p-1.5 z-10">
                        <Camera className="h-3.5 w-3.5" />
                      </div>
                    )}
                    
                    {/* Loading state */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                      
                    {/* Media preview */}
                    {media.type === 'video' ? (
                      <video 
                        src={media.url}
                        className="absolute inset-0 w-full h-full object-cover z-20"
                        onLoadedData={(e) => {
                          const video = e.target as HTMLVideoElement;
                          const container = video.closest('div.relative');
                          if (container) {
                            const spinner = container.querySelector('div.absolute');
                            if (spinner instanceof HTMLElement) {
                              spinner.style.display = 'none';
                            }
                          }
                        }}
                      />
                    ) : (
                      <img 
                        src={media.url}
                        alt={`${room.roomName} ${imgIndex + 1}`}
                        className="absolute inset-0 w-full h-full object-cover z-20"
                        onLoad={(e) => {
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
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          
                          const container = img.closest('div.relative');
                          if (container) {
                            const spinner = container.querySelector('div.absolute');
                            if (spinner instanceof HTMLElement) {
                              spinner.innerHTML = '<div class="p-2 text-red-500 text-xs text-center">Failed to load</div>';
                            }
                          }
                        }}
                      />
                    )}
                      
                    {/* Play button for videos */}
                    {media.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 