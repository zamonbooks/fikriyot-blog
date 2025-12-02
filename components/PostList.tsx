'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/types/post';
import { ChannelInfo } from '@/types/channel';
import { jsonService } from '@/lib/json-service';
import { channelService } from '@/lib/channel-service';
import PostCard from './PostCard';

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load posts and channel info in parallel
        const [postsData, channelData] = await Promise.all([
          jsonService.getAllPosts(),
          channelService.getChannelInfo(),
        ]);
        
        setPosts(postsData);
        setChannelInfo(channelData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Postlarni yuklashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-scroll to bottom (latest post) on mount
  useEffect(() => {
    if (posts.length > 0 && !loading) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [posts.length, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Postlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Xatolik
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Postlar topilmadi
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Hozircha hech qanday post yo'q
          </p>
        </div>
      </div>
    );
  }

  // Reverse posts - oldest first (like Telegram)
  const reversedPosts = [...posts].reverse();
  
  // Use channel info or defaults
  const channelTitle = channelInfo?.title || 'Fikriyot';
  const channelUsername = channelInfo?.username || 'fikriyot_uz';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Fixed Header - Liquid Glass Style */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/30 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z" />
              </svg>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {channelTitle}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {posts.length} ta post
                </p>
              </div>
            </div>
            <a
              href={`https://t.me/${channelUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-sm border border-blue-500/20 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              Telegram
            </a>
          </div>
        </div>
      </header>

      {/* Posts - Reversed order (oldest first, like Telegram) */}
      <main className="max-w-4xl mx-auto px-4 pt-20 pb-8">
        <div className="space-y-8">
          {reversedPosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              priority={index < 3}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-t border-white/20 dark:border-gray-700/30 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            <a
              href={`https://t.me/${channelUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              @{channelUsername}
            </a>
            {' '}kanalining rasmiy veb-sayti
          </p>
        </div>
      </footer>
    </div>
  );
}