import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent scrolling on the body when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Handle click outside the modal
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md animate-in zoom-in-95 duration-200"
      >
        {title && (
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 