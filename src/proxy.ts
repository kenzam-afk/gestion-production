import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as string;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (pathname.startsWith('/production') && role !== 'responsable_production') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (pathname.startsWith('/fournisseur') && role !== 'fournisseur') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (pathname.startsWith('/livreur') && role !== 'livreur') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (pathname.startsWith('/client') && role !== 'client') {
      return NextResponse.redirect(new URL('/', req.url));
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
  matcher: ['/admin/:path*', '/production/:path*', '/fournisseur/:path*', '/livreur/:path*', '/client/:path*'],
};