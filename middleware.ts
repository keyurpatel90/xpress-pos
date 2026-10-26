import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const redirectTo = (pathname: string, search = '') => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };
  if ((path.startsWith('/app') || path.startsWith('/admin')) && !user) {
    return redirectTo('/login', `?next=${encodeURIComponent(path)}`);
  }
  if (user && (path === '/login' || path === '/signup')) return redirectTo('/app');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/billing/webhook|b/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
