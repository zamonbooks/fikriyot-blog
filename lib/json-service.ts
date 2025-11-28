import { Post } from '@/types/post';
import postsData from '@/data/posts.json';

export class JsonService {
  /**
   * JSON fayldan postlarni olish
   */
  async getAllPosts(): Promise<Post[]> {
    return postsData.posts as Post[];
  }

  /**
   * Pagination bilan postlarni olish
   */
  async getPostsPaginated(page: number = 1, pageSize: number = 10): Promise<{
    posts: Post[];
    hasMore: boolean;
    total: number;
  }> {
    const allPosts = postsData.posts as Post[];
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    const posts = allPosts.slice(startIndex, endIndex);
    const hasMore = endIndex < allPosts.length;
    
    return {
      posts,
      hasMore,
      total: allPosts.length,
    };
  }
}

export const jsonService = new JsonService();