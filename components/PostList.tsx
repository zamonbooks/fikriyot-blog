'use client';

import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/types/post';
import TelegramWidget from './TelegramWidget';

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const PAGE_SIZE = 10;

  useEffect(() => {
    // Firestore'dan dastlabki postlarni real-time o'qish
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('timestamp', 'desc'),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData: Post[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Post));

        setPosts(postsData);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching posts:', err);
        setError('Postlarni yuklashda xatolik yuz berdi');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loadingMore, lastDoc]);

  const loadMorePosts = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newPosts: Post[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Post));

      setPosts(prev => [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-600 text-lg">Hozircha postlar yo'q</p>
        <p className="text-gray-500 mt-2">Yangi postlar tez orada qo'shiladi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>📅</span>
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <a
                href={`https://t.me/${post.channelUsername}/${post.postId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Telegramda ko'rish →
              </a>
            </div>
          </div>
          
          <div className="p-4">
            <TelegramWidget
              channelUsername={post.channelUsername}
              postId={post.postId}
            />
          </div>
        </div>
      ))}

      {/* Lazy loading trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {loadingMore ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Yuklanmoqda...</span>
            </div>
          ) : (
            <button
              onClick={loadMorePosts}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ko'proq yuklash
            </button>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="py-8 text-center text-gray-500">
          Barcha postlar yuklandi
        </div>
      )}
    </div>
  );
}
