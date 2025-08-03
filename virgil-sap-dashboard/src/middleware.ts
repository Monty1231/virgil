import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
    const isActive = token?.isActive;

    // If user is not authenticated and trying to access protected route
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // If user is authenticated but not active and trying to access protected route
    if (isAuth && !isActive && !isAuthPage) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }

    // If user is authenticated and active but trying to access auth pages
    if (isAuth && isActive && isAuthPage) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without requiring authentication
        if (req.nextUrl.pathname.startsWith("/auth")) {
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
