import { Post } from '@/types/post';
import postsData from '@/data/posts.json';
import samplePostsData from '@/data/sample-posts.json';

export class JsonService {
  /**
   * JSON fayldan postlarni olish
   * Development mode'da sample data ishlatiladi
   */
  async getAllPosts(): Promise<Post[]> {
    // Development uchun sample data
    const useSampleData = process.env.NEXT_PUBLIC_USE_SAMPLE_DATA === 'true';
    
    if (useSampleData) {
      return samplePostsData.posts as Post[];
    }
    
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
    const allPosts = await this.getAllPosts();
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