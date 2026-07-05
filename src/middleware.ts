import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Clerk configuration check ───────────────────────────────────────────────
// When Clerk API keys are placeholder/dev values, we skip server-side auth
// protection entirely. The BetaAccessGate component handles client-side
// protection instead. Set valid Clerk keys in .env.local to enable full
// server-side auth via clerkMiddleware.

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const SECRET_KEY = process.env.CLERK_SECRET_KEY || "";
const isClerkConfigured =
  PUBLISHABLE_KEY.startsWith("pk_test_") &&
  !PUBLISHABLE_KEY.includes("placeholder") &&
  SECRET_KEY.startsWith("sk_test_") &&
  !SECRET_KEY.includes("placeholder");

// ── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // Dev mode: Clerk not configured — allow all requests through
  if (!isClerkConfigured) {
    return NextResponse.next();
  }

  // Production mode: Clerk is configured — enforce server-side auth
  try {
    const { clerkMiddleware, createRouteMatcher } = await import(
      "@clerk/nextjs/server"
    );
    const isPublicRoute = createRouteMatcher([]);

    // Wrap in clerkMiddleware for auth protection
    const handler = clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    });

    return handler(request as any, undefined as any);
  } catch (error) {
    console.warn("[Middleware] Clerk auth check failed, allowing request:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};