import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter for Edge/local development
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests/min

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitData = rateLimitMap.get(ip);

  if (!limitData || now > limitData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  limitData.count++;
  if (limitData.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "127.0.0.1";

  // 1. Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. CSRF Protection for state-changing API requests
    const method = request.method;
    if (["POST", "PUT", "DELETE"].includes(method)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");

      // Verify Origin matches Host
      if (origin && host && !origin.includes(host)) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF check failed: invalid origin." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // 3. Dynamic CSP Nonce generation (using edge-safe btoa)
  const nonce = btoa(crypto.randomUUID());
  
  // Strict CSP: Allow standard scripts and fonts, restrict connections to self
  const cspHeaderValue = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self';
    img-src 'self' data:;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
  `.replace(/\s{2,}/g, " ").trim();

  // Clone headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", cspHeaderValue);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("content-security-policy", cspHeaderValue);
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
