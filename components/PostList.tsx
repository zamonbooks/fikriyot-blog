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
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border-2 border-black rounded-none p-8 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-600 rounded-none p-8 text-center">
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white border-2 border-black rounded-none p-16 text-center">
        <p className="text-gray-800 text-xl font-medium">Hozircha postlar yo'q</p>
        <p className="text-gray-600 mt-3">Yangi postlar tez orada qo'shiladi</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {posts.map((post) => (
        <article key={post.id} className="bg-white border-2 border-black rounded-none overflow-hidden hover:shadow-lg transition-shadow">
          <div className="p-6 bg-gray-50 border-b-2 border-black">
            <div className="flex items-center justify-between">
              <time dateTime={post.date} className="text-sm font-medium text-gray-700">
                {new Date(post.date).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
              <a
                href={`https://t.me/${post.channelUsername}/${post.postId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-gray-600 text-sm font-bold transition-colors"
              >
                Telegramda ko'rish →
              </a>
            </div>
          </div>
          
          <div className="p-6">
            <TelegramWidget
              channelUsername={post.channelUsername}
              postId={post.postId}
            />
          </div>
        </article>
      ))}

      {hasMore && (
        <div ref={loadMoreRef} className="py-12 text-center">
          {loadingMore ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-black"></div>
              <span className="ml-4 text-gray-700 font-medium">Yuklanmoqda...</span>
            </div>
          ) : (
            <button
              onClick={loadMorePosts}
              className="bg-black text-white px-8 py-4 rounded-none hover:bg-gray-800 transition-colors font-bold text-sm uppercase tracking-wider"
            >
              Ko'proq yuklash
            </button>
          )}
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="py-12 text-center text-gray-600 font-medium">
          Barcha postlar yuklandi
        </div>
      )}
    </div>
  );
}
