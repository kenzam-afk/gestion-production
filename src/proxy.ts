import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Routes admin
    if (pathname.startsWith('/produits') || 
        pathname.startsWith('/clients') || 
        pathname.startsWith('/commandes') || 
        pathname.startsWith('/fabrication') || 
        pathname.startsWith('/rapports')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Routes client
    if (pathname.startsWith('/client')) {
      if (token?.role !== 'client') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    // Routes livreur
    if (pathname.startsWith('/livreur')) {
      if (token?.role !== 'livreur') {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/produits/:path*',
    '/clients/:path*',
    '/commandes/:path*',
    '/fabrication/:path*',
    '/rapports/:path*',
    '/client/:path*',
    '/livreur/:path*',
  ],
};