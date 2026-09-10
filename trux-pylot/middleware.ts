import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get('tp_session');

  if (pathname === '/NgNji' || pathname.startsWith('/NgNji/')) {
    // /NgNji is intentionally not linked publicly. The page itself performs
    // the final role check; middleware only prevents accidental exposure of
    // protected sub-routes and preserves the normal login flow.
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard') && !sessionCookie) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/NgNji/:path*', '/NgNji'],
};
