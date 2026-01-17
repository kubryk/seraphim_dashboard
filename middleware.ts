import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Захищаємо тільки API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.API_KEY;
    
    // Якщо API_KEY не встановлено в .env, пропускаємо (для розробки)
    if (!validApiKey) {
      console.warn('⚠️ API_KEY not set in environment variables. Skipping authentication.');
      return NextResponse.next();
    }
    
    // Перевірка API ключа
    if (!apiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Invalid or missing API key.' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
