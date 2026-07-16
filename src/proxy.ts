import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Only run auth middleware on protected app routes — NOT on the landing page or public assets.
    // This prevents a Supabase network call on every single request.
    '/dashboard/:path*',
    '/subjects/:path*',
    '/questions/:path*',
    '/tests/:path*',
    '/chapters/:path*',
    '/learn/:path*',
    '/exams/:path*',
    '/settings/:path*',
    '/admin',
    '/admin/:path*',
  ],
}
