import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth);
  const isAuthRoute = nextUrl.pathname === "/auth";

  if (!isAuthRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth", nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    const destination =
      req.auth?.user?.role === "ADMIN" ? "/admin/schedule" : "/dashboard";
    return NextResponse.redirect(new URL(destination, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/gpa/:path*",
    "/materials/:path*",
    "/schedule/:path*",
    "/ai-coach/:path*",
    "/profile/:path*",
    "/auth",
  ],
};
