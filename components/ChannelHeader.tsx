'use client';

import { useEffect, useState } from 'react';
import { channelService } from '@/lib/channel-service';
import { ChannelInfo } from '@/types/channel';

export default function ChannelHeader() {
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChannelInfo = async () => {
      try {
        const info = await channelService.getChannelInfo();
        setChannelInfo(info);
      } catch (error) {
        console.error('Error loading channel info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannelInfo();
  }, []);

  // Use default values while loading
  const title = channelInfo?.title || 'Fikriyot';
  const username = channelInfo?.username || 'fikriyot_uz';
  const description = channelInfo?.description || 'Nodavlat fikrlog. HAQqa ishqsiz — ishqqa haqsiz!';

  return (
    <header className="relative overflow-hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-black/80 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col items-center text-center">
          {/* Logo with glassmorphism effect */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-110"></div>
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-6 shadow-2xl">
              <img 
                src="/logo.svg" 
                alt={title} 
                className="w-24 h-24 md:w-32 md:h-32 filter drop-shadow-2xl" 
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl">
            {title}
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mb-8">
            {description}
          </p>
          
          {/* Glassmorphism button */}
          <div className="flex items-center space-x-4">
            <a 
              href={`https://t.me/${username}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="relative group"
            >
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-2xl">
                📱 Telegram kanalimiz
              </div>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
