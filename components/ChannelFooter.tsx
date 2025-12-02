'use client';

import { useEffect, useState } from 'react';
import { channelService } from '@/lib/channel-service';
import { ChannelInfo } from '@/types/channel';

export default function ChannelFooter() {
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);

  useEffect(() => {
    const loadChannelInfo = async () => {
      try {
        const info = await channelService.getChannelInfo();
        setChannelInfo(info);
      } catch (error) {
        console.error('Error loading channel info:', error);
      }
    };

    loadChannelInfo();
  }, []);

  const username = channelInfo?.username || 'fikriyot_uz';
  const description = channelInfo?.description || 'Nodavlat fikrlog';

  return (
    <footer className="relative mt-20 overflow-hidden">
      {/* Glassmorphism footer background */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.05),transparent_70%)]"></div>
      
      <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="border-t border-white/10 pt-8">
          <p className="text-gray-400 text-sm mb-4">© 2024 Fikriyot. Barcha huquqlar himoyalangan.</p>
          <div className="flex justify-center items-center space-x-6">
            <a 
              href={`https://t.me/${username}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative"
            >
              <div className="absolute inset-0 bg-white/10 rounded-full blur-lg group-hover:bg-white/20 transition-all duration-300"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2">
                <span>📱</span>
                <span>Telegram</span>
              </div>
            </a>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400 text-sm">{description}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
