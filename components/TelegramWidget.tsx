'use client';

import { useEffect, useRef, useState } from 'react';

interface TelegramWidgetProps {
  channelUsername: string;
  postId: number;
  width?: number | string;
}

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function TelegramWidget({
  channelUsername,
  postId,
  width = '100%',
}: TelegramWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Telegram Widget script'ni yuklash
    const loadTelegramWidget = () => {
      // Script allaqachon yuklangan bo'lsa
      if (window.Telegram) {
        renderWidget();
        return;
      }

      // Script'ni yuklash
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.onload = () => {
        renderWidget();
      };
      script.onerror = () => {
        console.error('Failed to load Telegram widget script');
        setError(true);
      };

      document.body.appendChild(script);
    };

    const renderWidget = () => {
      if (!containerRef.current) return;

      // Container'ni tozalash
      containerRef.current.innerHTML = '';

      // Widget elementi yaratish
      const widgetDiv = document.createElement('div');
      widgetDiv.className = 'telegram-post';
      widgetDiv.setAttribute('data-telegram-post', `${channelUsername}/${postId}`);
      widgetDiv.setAttribute('data-width', width.toString());
      widgetDiv.setAttribute('data-userpic', 'false');

      containerRef.current.appendChild(widgetDiv);

      // Widget'ni render qilish
      if (window.Telegram?.Post) {
        try {
          window.Telegram.Post.init();
          setIsLoaded(true);
        } catch (err) {
          console.error('Error initializing Telegram widget:', err);
          setError(true);
        }
      }
    };

    loadTelegramWidget();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [channelUsername, postId, width]);

  if (error) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-xl border border-white/10"></div>
        <div className="relative p-6 text-center">
          <div className="text-4xl mb-3">📱</div>
          <p className="text-gray-300 mb-4">Widget yuklanmadi</p>
          <a
            href={`https://t.me/${channelUsername}/${postId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-block"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-lg group-hover:bg-white/30 transition-all duration-300"></div>
            <div className="relative bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 text-white px-4 py-2 rounded-full transition-all duration-300 transform hover:scale-105">
              Telegramda ko'rish
            </div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="telegram-widget-container">
      <div ref={containerRef} className="min-h-[200px]">
        {!isLoaded && (
          <div className="relative">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-xl border border-white/10"></div>
            <div className="relative flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white/60 mx-auto mb-4"></div>
                <p className="text-gray-300 text-sm">Widget yuklanmoqda...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
