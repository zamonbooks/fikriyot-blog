import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  deleteDoc,
  doc,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Post, PostInput } from '@/types/post';

export class FirestoreService {
  private collectionName = 'posts';

  /**
   * Barcha postlarni olish (pagination bilan)
   */
  async getAllPosts(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null }> {
    try {
      const postsRef = collection(db, this.collectionName);
      
      let q = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const posts: Post[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Post));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

      return { posts, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  }

  /**
   * Yangi postlarni qo'shish (batch)
   */
  async addPosts(posts: PostInput[]): Promise<string[]> {
    try {
      const postsRef = collection(db, this.collectionName);
      const addedIds: string[] = [];

      for (const post of posts) {
        // Duplicate check: postId va channelUsername bo'yicha
        const existingPost = await this.getPostByTelegramId(
          post.channelUsername,
          post.postId
        );

        if (existingPost) {
          console.log(`Post already exists: ${post.channelUsername}/${post.postId}`);
          continue;
        }

        const docRef = await addDoc(postsRef, {
          ...post,
          createdAt: new Date().toISOString(),
        });

        addedIds.push(docRef.id);
      }

      console.log(`Added ${addedIds.length} posts`);
      return addedIds;
    } catch (error) {
      console.error('Error adding posts:', error);
      throw error;
    }
  }

  /**
   * Bitta post qo'shish
   */
  async addPost(post: PostInput): Promise<string> {
    const ids = await this.addPosts([post]);
    return ids[0];
  }

  /**
   * Telegram post ID bo'yicha post olish
   */
  async getPostByTelegramId(
    channelUsername: string,
    postId: number
  ): Promise<Post | null> {
    try {
      const postsRef = collection(db, this.collectionName);
      const q = query(
        postsRef,
        where('channelUsername', '==', channelUsername),
        where('postId', '==', postId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Post;
    } catch (error) {
      console.error('Error getting post by Telegram ID:', error);
      throw error;
    }
  }

  /**
   * Eng so'nggi post ID ni olish
   */
  async getLatestPostId(channelUsername: string): Promise<number | null> {
    try {
      const postsRef = collection(db, this.collectionName);
      const q = query(
        postsRef,
        where('channelUsername', '==', channelUsername),
        orderBy('postId', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return null;
      }

      const post = snapshot.docs[0].data() as Post;
      return post.postId;
    } catch (error) {
      console.error('Error getting latest post ID:', error);
      throw error;
    }
  }

  /**
   * Postni o'chirish
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, this.collectionName, postId);
      await deleteDoc(postRef);
      console.log(`Post deleted: ${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Telegram post ID bo'yicha postni o'chirish
   */
  async deletePostByTelegramId(
    channelUsername: string,
    postId: number
  ): Promise<boolean> {
    try {
      const post = await this.getPostByTelegramId(channelUsername, postId);
      
      if (!post) {
        console.log(`Post not found: ${channelUsername}/${postId}`);
        return false;
      }

      await this.deletePost(post.id);
      return true;
    } catch (error) {
      console.error('Error deleting post by Telegram ID:', error);
      throw error;
    }
  }
}

// Singleton instance
let firestoreService: FirestoreService | null = null;

export function getFirestoreService(): FirestoreService {
  if (!firestoreService) {
    firestoreService = new FirestoreService();
  }
  return firestoreService;
}
