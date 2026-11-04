import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

// Proxy (called Middleware before Next 16) runs before every matched request.
// It does two things:
//   1. Refreshes the Supabase session so the cookie doesn't expire mid-visit.
//   2. Optimistically redirects logged-out users away from protected pages.
// It is NOT the security boundary; every page and action still checks the
// user via src/server/auth.ts.

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseEnv.SUPABASE_URL,
    supabaseEnv.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Write refreshed cookies to the request (so this render sees them)
          // and to the response (so the browser stores them).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          // Cache-Control headers from Supabase so a CDN never caches a
          // response that carries someone's session cookie.
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Verifies the session token's signature and refreshes it if needed.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  if (!isLoggedIn && !PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Skip static assets and image optimization; run on everything else.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
