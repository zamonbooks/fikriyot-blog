import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreService } from '@/lib/firestore-service';
import { jsonService } from '@/lib/json-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const useFirestore = searchParams.get('source') === 'firestore';

    let posts;

    if (useFirestore) {
      try {
        const firestoreService = getFirestoreService();
        const result = await firestoreService.getAllPosts(limit);
        posts = result.posts;
      } catch (error) {
        console.error('Firestore error, falling back to JSON:', error);
        const allPosts = await jsonService.getAllPosts();
        posts = allPosts.slice(0, limit);
      }
    } else {
      const allPosts = await jsonService.getAllPosts();
      posts = allPosts.slice(0, limit);
    }

    const response = NextResponse.json({
      posts,
      count: posts.length,
      source: useFirestore ? 'firestore' : 'json',
      timestamp: new Date().toISOString(),
    });

    // Cache headers
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}