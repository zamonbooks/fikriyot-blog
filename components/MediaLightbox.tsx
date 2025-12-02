'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: 'image' | 'video';
  mediaUrls: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  caption?: string;
}

function getHighQualityCloudinaryUrl(url: string): string {
  if (!url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/q_auto:best,f_auto/');
}

export default function MediaLightbox({
  isOpen,
  onClose,
  mediaType,
  mediaUrls,
  currentIndex,
  onNavigate,
  caption
}: MediaLightboxProps) {
  // Handle keyboard events and body scroll lock
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < mediaUrls.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyboard);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, currentIndex, mediaUrls.length, onNavigate]);

  if (!isOpen || mediaUrls.length === 0) return null;

  const lightboxContent = (
    <div 
      className="fixed inset-0 z-50 bg-black/95 animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all hover:scale-110 z-10"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Media content - prevent click propagation */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        {mediaType === 'image' ? (
          <div className="relative flex items-center justify-center max-w-full max-h-full">
            <img
              src={getHighQualityCloudinaryUrl(mediaUrls[currentIndex])}
              alt={caption || 'Image'}
              className="max-w-full max-h-full object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            {mediaUrls.length > 1 && (
              <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/70 text-white text-sm rounded-full font-medium">
                Qism {currentIndex + 1}/{mediaUrls.length}
              </div>
            )}
            <video
              src={mediaUrls[currentIndex]}
              controls
              autoPlay
              playsInline
              crossOrigin="anonymous"
              className="max-w-full max-h-full object-contain"
            >
              Brauzeringiz video'ni qo'llab-quvvatlamaydi.
            </video>
          </div>
        )}
      </div>

      {/* Navigation controls for media groups */}
      {mediaUrls.length > 1 && (
        <>
          {/* Previous button */}
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all hover:scale-110"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Next button */}
          {currentIndex < mediaUrls.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all hover:scale-110"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white font-medium">
            {currentIndex + 1} / {mediaUrls.length}
          </div>
        </>
      )}
    </div>
  );

  // Render using portal to ensure it's attached to document.body
  return typeof window !== 'undefined' ? createPortal(lightboxContent, document.body) : null;
}
