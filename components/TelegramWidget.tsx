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
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-3">Post yuklanmadi</p>
        <a
          href={`https://t.me/${channelUsername}/${postId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Telegramda ko'rish
        </a>
      </div>
    );
  }

  return (
    <div className="telegram-widget-container">
      <div ref={containerRef} className="min-h-[200px]">
        {!isLoaded && (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
