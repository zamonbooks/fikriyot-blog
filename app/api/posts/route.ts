import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreService } from '@/lib/firestore-service';
import { jsonService } from '@/lib/json-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const useFirestore = searchParams.get('source') === 'firestore';

    let posts;
    let hasMore = false;
    let total = 0;

    if (useFirestore) {
      try {
        const firestoreService = getFirestoreService();
        const result = await firestoreService.getAllPosts(pageSize);
        posts = result.posts;
        hasMore = result.lastDoc !== null;
        total = posts.length; // Firestore'da total count olish qiyin
      } catch (error) {
        console.error('Firestore error, falling back to JSON:', error);
        const result = await jsonService.getPostsPaginated(page, pageSize);
        posts = result.posts;
        hasMore = result.hasMore;
        total = result.total;
      }
    } else {
      const result = await jsonService.getPostsPaginated(page, pageSize);
      posts = result.posts;
      hasMore = result.hasMore;
      total = result.total;
    }

    const response = NextResponse.json({
      posts,
      pagination: {
        page,
        pageSize,
        hasMore,
        total,
      },
      source: useFirestore ? 'firestore' : 'json',
    });

    // Cache headers
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    
    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}