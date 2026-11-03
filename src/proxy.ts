import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'reviewpulse_production_jwt_secret_key_8492048102938472910384';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const SESSION_COOKIE_NAME = 'rp_session';

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OWNER';
  businessId?: string;
  businessSlug?: string;
}

async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const session = await getSessionFromRequest(request);
  const isAuthenticated = Boolean(session);

  // 1. Customer Review Funnels (/r/[slug]) - MUST always remain 100% public
  if (pathname.startsWith('/r/')) {
    return NextResponse.next();
  }

  // 2. Contact & Support page - Always accessible to both guests and logged-in merchants
  if (pathname === '/contact') {
    return NextResponse.next();
  }

  // 3. Pricing page - Always accessible to view plans & feature comparisons
  if (pathname === '/pricing') {
    return NextResponse.next();
  }

  // 4. Protected App Routes: /dashboard and /admin
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based authorization: Only SUPER_ADMIN can enter /admin
    if (pathname.startsWith('/admin') && session?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 5. Auth Pages: /login, /register, /forgot-password
  // If already authenticated, redirect directly to their app portal!
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  if (isAuthRoute) {
    if (isAuthenticated) {
      const target = session?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 6. Root Landing Page ('/')
  if (pathname === '/') {
    // Check if user explicitly wants to view the public website (e.g. ?public=true or ?preview=true)
    const isPublicPreview = searchParams.get('public') === 'true' || searchParams.get('preview') === 'true';

    // If authenticated AND NOT explicitly previewing public website:
    // Approach B: App-First redirect straight into the app portal!
    if (isAuthenticated && !isPublicPreview) {
      const target = session?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static image & media files (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     * - api routes (APIs handle their own status codes and authentication)
     */
    '/((?!_next/static|_next/image|api|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

