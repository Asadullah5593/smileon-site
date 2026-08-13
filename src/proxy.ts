import { NextResponse, type NextRequest } from "next/server";

// Next 16 renamed Middleware to Proxy. Two jobs here:
//   1. Content-Security-Policy with a per-request nonce.
//   2. An *optimistic* auth gate that bounces obviously-signed-out visitors
//      away from /admin so they see the login page instead of a flash of the
//      shell. Real enforcement lives in the admin layout and in every route
//      handler via `requirePermission()`.
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

function contentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    // `strict-dynamic` lets the nonced Next bootstrap load the rest of the
    // bundle. React needs `eval` in development for its error overlay only.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // `unsafe-inline` is unavoidable here, not laziness: Radix sets inline
    // `style` attributes at runtime to position dialogs, dropdowns, selects and
    // popovers. A nonce cannot cover style *attributes*, so a strict style-src
    // would break most of the admin UI. Style injection is also a far smaller
    // prize than script injection, which stays locked down.
    "style-src 'self' 'unsafe-inline'",
    // `https:` because media may be served from S3 or a CDN once
    // `STORAGE_DRIVER=s3`; `blob:`/`data:` for previews in the media picker.
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    // The contact page embeds whatever map URL the CMS is given.
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = contentSecurityPolicy(nonce);

  // Next reads the nonce back off the request headers when it renders, and
  // stamps it onto its own script tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Everything that renders HTML. API routes return JSON and static assets
      // are served verbatim, so neither needs a nonce.
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      // Prefetches reuse the document's policy; issuing them a fresh nonce
      // would only invalidate the cached payload.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
