import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;

    // Définition des accès
    const isAdmin = role === "admin";
    const isResponsable = role === "responsable_production";

    // Si l'utilisateur tente d'aller dans /admin
    if (req.nextUrl.pathname.startsWith("/admin")) {
      // On laisse passer l'admin OU le responsable de production
      if (!isAdmin && !isResponsable) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };