import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed Middleware to Proxy. This is an *optimistic* gate only: it
// bounces obviously-signed-out visitors away from /admin so they see the login
// page instead of a flash of the shell. Real enforcement lives in the admin
// layout and in every route handler via `requirePermission()`.
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
