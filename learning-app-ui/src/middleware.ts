// middleware.js
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/reset-password", "/auth/register"];

  // Check if current route is public - auto allow
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    // Remove Authentication cookie when accessing login/register/reset-password routes
    if (
      pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/register") ||
      pathname.startsWith("/auth/reset-password")
    ) {
      const response = NextResponse.next();
      response.cookies.delete("Authentication");
      return response;
    }
    return NextResponse.next();
  }

  const token = request.cookies.get("Authentication")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Manual expiry check
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      const response = NextResponse.redirect(new URL("/auth/login", request.url));
      response.cookies.delete("Authentication");
      return response;
    }

    // Permission-based access control
    const userPermissions = (payload.permissions as string[]) || [];
    const userRole = payload.role;

    // Admin has access to all routes
    if (userRole === "ADMIN") {
      return NextResponse.next();
    }

    // Define route permissions mapping
    const routePermissions: { [key: string]: string[] } = {
      "/assistant": [], // No specific permission required
      "/attendance": ["CREATE_ATTENDANCE"],
      "/calendar": ["CREATE_CLASS"],
      "/classes": ["CREATE_CLASS"],
      "/histories": [], // No specific permission required
      "/notifications": [], // No specific permission required
      "/payments": ["CREATE_PAYMENT"],
      "/students": ["CREATE_STUDENT"],
      "/users": ["CREATE_USER"],
    };

    // Find the matching route and its required permissions
    const matchingRoute = Object.keys(routePermissions).find((route) => pathname.startsWith(route));

    if (matchingRoute) {
      const requiredPermissions = routePermissions[matchingRoute];

      // If route requires permissions, check if user has them
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some((permission) => userPermissions.includes(permission));

        if (!hasPermission) {
          return NextResponse.redirect(new URL("/not-found", request.url));
        }
      }
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("Authentication");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};
