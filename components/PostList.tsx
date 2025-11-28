'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/types/post';
import dynamic from 'next/dynamic';

// Dynamic import for TelegramWidget (lazy loading)
const TelegramWidget = dynamic(() => import('./TelegramWidget'), {
  loading: () => (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
  ssr: false, // Telegram widget client-side only
});
import { jsonService } from '@/lib/json-service';
import { getFirestoreService } from '@/lib/firestore-service';

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFirestore, setUseFirestore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);

  const loadInitialPosts = async () => {
    try {
      let initialPosts: Post[] = [];
      
      // Hozircha faqat JSON'dan foydalanish (Firestore muammosi tufayli)
      console.log('Loading posts from JSON...');
      initialPosts = await jsonService.getAllPosts();
      setUseFirestore(false);
      setHasMore(false); // JSON'da pagination yo'q
      console.log('✓ Posts loaded from JSON');
      
      // Firestore'ni keyinroq sinab ko'ramiz
      // try {
      //   const firestoreService = getFirestoreService();
      //   const result = await firestoreService.getAllPosts(10);
      //   
      //   if (result.posts.length > 0) {
      //     initialPosts = result.posts;
      //     setLastDoc(result.lastDoc);
      //     setHasMore(result.lastDoc !== null);
      //     setUseFirestore(true);
      //     console.log('✓ Posts loaded from Firestore');
      //   } else {
      //     throw new Error('No posts in Firestore');
      //   }
      // } catch (firestoreError) {
      //   console.log('Firestore not available, using JSON fallback');
      //   initialPosts = await jsonService.getAllPosts();
      //   setUseFirestore(false);
      //   setHasMore(false);
      //   console.log('✓ Posts loaded from JSON');
      // }
      
      setPosts(initialPosts);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Postlarni yuklashda xatolik yuz berdi');
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!useFirestore || !hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const firestoreService = getFirestoreService();
      const result = await firestoreService.getAllPosts(10, lastDoc);
      
      setPosts(prev => [...prev, ...result.posts]);
      setLastDoc(result.lastDoc);
      setHasMore(result.lastDoc !== null);
      
      console.log(`✓ Loaded ${result.posts.length} more posts`);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadInitialPosts();
  }, []);



  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="relative group">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"></div>
            <div className="relative p-8 animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-4 bg-white/20 rounded-full w-32"></div>
                <div className="h-4 bg-white/10 rounded-full w-24"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-white/10 rounded-full w-full"></div>
                <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
                <div className="h-32 bg-white/5 rounded-xl border border-white/10"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl"></div>
        <div className="relative p-8 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-300 font-medium text-lg">{error}</p>
          <p className="text-red-400 text-sm mt-2">Sahifani yangilab ko'ring</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"></div>
        <div className="relative p-12 md:p-20 text-center">
          <div className="text-6xl mb-6 filter drop-shadow-lg">📝</div>
          <p className="text-white text-xl md:text-2xl font-bold mb-3 drop-shadow-lg">Hozircha postlar yo'q</p>
          <p className="text-gray-300 text-base md:text-lg mb-6">Yangi fikrlar tez orada qo'shiladi</p>
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-lg"></div>
            <div className="relative bg-white/5 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
              <p className="text-gray-200 text-sm">
                📊 Ma'lumotlar: {useFirestore ? '🔥 Firestore' : '📄 JSON fayl'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Ma'lumotlar manbai ko'rsatkichi */}
      <div className="text-center">
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-white/10 rounded-full blur-lg"></div>
          <div className="relative bg-white/5 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full shadow-2xl">
            <p className="text-sm font-medium text-gray-200">
              {useFirestore ? '🔥 Real-time ma\'lumotlar' : '📄 Statik ma\'lumotlar'} • {posts.length} ta post
            </p>
          </div>
        </div>
      </div>

      {posts.map((post, index) => (
        <article 
          key={post.id} 
          className="group relative"
        >
          {/* Glassmorphism card */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="relative overflow-hidden rounded-2xl">
            {/* Header with glassmorphism */}
            <div className="relative p-6 border-b border-white/10">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>
                  <time dateTime={post.date} className="text-sm font-medium text-gray-300">
                    {new Date(post.date).toLocaleDateString('uz-UZ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                  {post.hasMedia && (
                    <span className="bg-white/10 backdrop-blur-md border border-white/20 text-gray-200 px-2 py-1 rounded-full text-xs font-medium">
                      📎 Media
                    </span>
                  )}
                </div>
                <a
                  href={`https://t.me/${post.channelUsername}/${post.postId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/btn relative"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-lg group-hover/btn:bg-white/30 transition-all duration-300"></div>
                  <div className="relative bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg">
                    📱 Telegramda ko'rish
                  </div>
                </a>
              </div>
            </div>
            
            {/* Content area */}
            <div className="relative p-6 md:p-8">
              <TelegramWidget
                channelUsername={post.channelUsername}
                postId={post.postId}
              />
            </div>
          </div>
        </article>
      ))}

      {/* Load More Button */}
      {useFirestore && hasMore && (
        <div className="text-center pt-12">
          <button
            onClick={loadMorePosts}
            disabled={loadingMore}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 group-disabled:bg-white/10 transition-all duration-300"></div>
            <div className="relative bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:border-white/10">
              {loadingMore ? '⏳ Yuklanmoqda...' : '📚 Ko\'proq fikrlar yuklash'}
            </div>
          </button>
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="text-center py-12">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-lg"></div>
            <div className="relative bg-white/5 backdrop-blur-md border border-white/20 rounded-full p-4 shadow-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-white/60"></div>
            </div>
          </div>
          <p className="text-gray-300 mt-4 font-medium">Yangi fikrlar yuklanmoqda...</p>
        </div>
      )}
    </div>
  );
}
