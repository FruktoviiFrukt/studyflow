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
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
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
    "/auth",
  ],
};
