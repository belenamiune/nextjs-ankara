import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminAccessRoute = request.nextUrl.pathname.startsWith("/admin-access");
  const isApiAdminAccessRoute = request.nextUrl.pathname.startsWith("/api/admin-access");

  if (!isAdminRoute || isAdminAccessRoute || isApiAdminAccessRoute) {
    return NextResponse.next();
  }

  const hasAdminCookie = request.cookies.get("ankara_admin")?.value === "true";

  if (!hasAdminCookie) {
    return NextResponse.redirect(new URL("/admin-access", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};