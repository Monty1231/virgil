import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isRootPage = req.nextUrl.pathname === "/";
    const isActive = token?.isActive;

    // If user is not authenticated and trying to access protected route (not root or auth)
    if (!isAuth && !isAuthPage && !isRootPage) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // If user is authenticated but not active and trying to access protected route
    if (isAuth && !isActive && !isAuthPage && !isRootPage) {
      return NextResponse.redirect(new URL("/request-access", req.url));
    }

    // If user is authenticated and active but trying to access auth pages
    if (isAuth && isActive && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If user is authenticated and active and trying to access root page, redirect to dashboard
    if (isAuth && isActive && isRootPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and root page without requiring authentication
        if (
          req.nextUrl.pathname.startsWith("/auth") ||
          req.nextUrl.pathname === "/"
        ) {
          return true;
        }
        // For all other pages, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - api/checkout (Stripe checkout APIs)
     * - checkout (server redirect to Stripe)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|api/checkout|checkout|_next/static|_next/image|favicon.ico|darkLogo.png|Virgil_blue.svg|vercel.svg|globe.svg|window.svg|next.svg|file.svg|pricing).*)",
  ],
};
