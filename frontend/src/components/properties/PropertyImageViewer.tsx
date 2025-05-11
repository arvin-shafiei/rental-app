import { useState, useEffect } from 'react';
import { Image, Loader2, Home, X, Trash2, Camera, Download, AlertCircle } from 'lucide-react';
import { getPropertyImages, deletePropertyImage } from '@/lib/api';
import Modal from '@/components/ui/modal';

interface PropertyImageViewerProps {
  propertyId: string;
}

interface RoomData {
  name: string;
  display_name?: string;
  images: {
    url: string;
    path: string;
    type: 'image' | 'video';
  }[];
}

interface ApiRoomData {
  name: string;
  display_name?: string;
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
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, path: string, name: string} | null>(null);
  
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
          a.name.localeCompare(b.name)
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

  const openDeleteModal = (e: React.MouseEvent, imagePath: string, name: string) => {
    e.stopPropagation(); // Prevent media modal from opening
    setDeleteModal({
      isOpen: true,
      path: imagePath,
      name
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal || isDeleting) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      await deletePropertyImage(propertyId, deleteModal.path);
      
      // Refresh the images after deletion
      await fetchPropertyImages();
      
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete image');
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };
  
  const handleDownloadMedia = (e: React.MouseEvent, url: string, name: string, index: number) => {
    e.stopPropagation(); // Prevent modal from opening
    
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    
    // Set filename based on room name and index
    const extension = url.split('.').pop() || '';
    a.download = `${formatRoomName(name)}_${index + 1}.${extension}`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatRoomName = (name: string): string => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-600">Loading media...</span>
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
      <div className="bg-gray-50 border border-gray-200 rounded-md p-5 text-center">
        <Image className="h-10 w-10 mx-auto text-gray-400 mb-2" />
        <h3 className="mt-1 text-sm font-medium text-gray-900">No Media</h3>
        <p className="text-xs text-gray-500">Start by uploading images or videos above.</p>
      </div>
    );
  }

  // Filter to rooms with single images for side-by-side layout
  const singleImageRooms = rooms.filter(room => room.images.length === 1);
  const multiImageRooms = rooms.filter(room => room.images.length > 1);

  return (
    <div>
      {/* Media Viewer Modal */}
      <Modal
        isOpen={!!selectedMedia}
        onClose={closeMediaModal}
        showCloseButton={false}
      >
        <div className="relative max-w-4xl max-h-screen mx-auto">
          <button 
            className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full p-1.5 text-white hover:bg-opacity-100 transition-colors z-10"
            onClick={closeMediaModal}
          >
            <X className="h-5 w-5" />
          </button>
          
          {selectedMedia && (
            isVideo ? (
              <video 
                src={selectedMedia} 
                controls
                autoPlay
                className="max-h-[80vh] max-w-full object-contain mx-auto" 
              />
            ) : (
              <img 
                src={selectedMedia} 
                alt="Full size" 
                className="max-h-[80vh] max-w-full object-contain mx-auto" 
              />
            )
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal?.isOpen}
        onClose={closeDeleteModal}
        title="Delete Media"
        showCloseButton={false}
      >
        <div className="flex items-start space-x-3">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700 mt-1">
              This will permanently delete this {isVideo ? "video" : "image"} from {deleteModal?.name ? formatRoomName(deleteModal.name) : ''}.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. Are you sure you want to continue?
            </p>
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm"
                onClick={closeDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm flex items-center"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Special layout for rooms with single images - displayed side by side */}
      {singleImageRooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {singleImageRooms.map((room) => (
            <div key={room.name} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                  <Home className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-800">
                    {formatRoomName(room.name)}
                  </h3>
                </div>
                
                {/* Action buttons at room header level */}
                <div className="flex space-x-1">
                  <button
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 rounded p-1 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadMedia(e, room.images[0].url, room.name, 0);
                    }}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    className="bg-red-50 hover:bg-red-100 text-red-600 rounded p-1 transition-colors"
                    onClick={(e) => openDeleteModal(e, room.images[0].path, room.name)}
                    disabled={isDeleting}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div 
                className="p-2 cursor-pointer"
                onClick={() => openMediaModal(room.images[0].url, room.images[0].type === 'video')}
              >
                <div className="relative rounded-md overflow-hidden bg-gray-100 aspect-video">
                  {/* Video indicator */}
                  {room.images[0].type === 'video' && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white rounded-full p-1 z-10">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                  
                  {/* Loading state */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                  </div>
                  
                  {/* Media preview */}
                  {room.images[0].type === 'video' ? (
                    <video 
                      src={room.images[0].url}
                      className="w-full h-full object-cover z-20"
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
                      src={room.images[0].url}
                      alt={`${room.name}`}
                      className="w-full h-full object-cover z-20"
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
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular grid layout for rooms with multiple images */}
      {multiImageRooms.length > 0 && (
        <div className="space-y-4">
          {multiImageRooms.map((room) => (
            <div key={room.name} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center">
                  <Home className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-800">
                    {formatRoomName(room.name)}
                  </h3>
                </div>
              </div>
              
              <div className="p-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {room.images.map((media, imgIndex) => (
                    <div 
                      key={imgIndex} 
                      className="group relative rounded-md overflow-hidden bg-gray-100 aspect-square cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openMediaModal(media.url, media.type === 'video')}
                    >
                      {/* Always visible media controls with improved visibility */}
                      <div className="absolute top-0 right-0 p-1 z-20 flex space-x-1 bg-white/60 backdrop-blur-sm rounded-bl-md">
                        <button
                          className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-1.5 transition-colors"
                          onClick={(e) => handleDownloadMedia(e, media.url, room.name, imgIndex)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1.5 transition-colors"
                          onClick={(e) => openDeleteModal(e, media.path, room.name)}
                          disabled={isDeleting}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Video indicator */}
                      {media.type === 'video' && (
                        <div className="absolute top-1 left-1 bg-black bg-opacity-60 text-white rounded-full p-1 z-10">
                          <Camera className="h-3 w-3" />
                        </div>
                      )}
                      
                      {/* Loading state */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
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
                          alt={`${room.name} ${imgIndex + 1}`}
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
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 