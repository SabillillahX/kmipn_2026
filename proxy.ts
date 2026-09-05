import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const authenticated = request.cookies.get("splik_session")?.value || (process.env.NODE_ENV === "development" && request.cookies.get("splik_local_admin")?.value === "1");
  if (request.nextUrl.pathname.startsWith("/dashboard") && !authenticated) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
