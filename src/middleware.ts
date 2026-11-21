import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPrepAuthBypassEnabled } from "@/lib/prep/auth-bypass";
import { isPrepCacheablePath, isPrepPublicPath } from "@/lib/prep/constants";
import {
  hasCompletedPrepOnboarding,
  hasOnboardingCookie,
  onboardingCookieValue,
  PREP_ONBOARDING_COOKIE,
  isPrepOnboardingGatedPath,
  isPrepSessionRequiredPath,
  prepOnboardingRedirectUrl,
} from "@/lib/prep/onboarding/gate";
import { getPrepUserFromMiddleware } from "@/lib/prep/supabase/middleware";

/**
 * A redirect built in middleware starts with no cookies. If the session was
 * refreshed while reading the user, the new tokens live on `from`; without
 * copying them the browser keeps a refresh token that has already been used.
 */
function carryCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

function setNoStore(res: NextResponse): void {
  res.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
}

/**
 * Public marketing pages are identical for every visitor, so they may be cached.
 * They used to get `no-store` like everything under /prep, which also switches
 * off the Next.js client router cache — every click in the top nav refetched the
 * page from the server, and going back refetched it again. That is the delay.
 *
 * Anything that depends on a session keeps `no-store`: a cached authenticated
 * page is a far worse bug than a slow one.
 */
function setPublicCache(res: NextResponse): void {
  res.headers.set(
    "Cache-Control",
    "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
  );
}

async function handlePrepAuthenticatedRequest(req: NextRequest): Promise<NextResponse> {
  if (isPrepAuthBypassEnabled()) {
    const res = NextResponse.next();
    setNoStore(res);
    return res;
  }

  const { user, response, supabase } = await getPrepUserFromMiddleware(req);
  if (!user) {
    // The login page, not straight to Google: it offers Google and the email code,
    // and someone who has just signed out should not be pushed into an account chooser.
    const login = new URL("/prep/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    setNoStore(redirect);
    return carryCookies(response, redirect);
  }

  if (isPrepOnboardingGatedPath(req.nextUrl.pathname) && supabase) {
    // Skip the database round trip when this account is already known to have
    // finished. With the database in Tokyo that query alone costs ~250ms on
    // every navigation, before the page starts rendering.
    const cookieSaysDone = hasOnboardingCookie(
      req.cookies.get(PREP_ONBOARDING_COOKIE)?.value,
      user.id,
    );
    const completed = cookieSaysDone || (await hasCompletedPrepOnboarding(supabase, user.id));
    if (completed && !cookieSaysDone) {
      response.cookies.set(PREP_ONBOARDING_COOKIE, onboardingCookieValue(user.id), {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 180,
      });
    }
    if (!completed) {
      const onboarding = prepOnboardingRedirectUrl(
        req.url,
        req.nextUrl.pathname + req.nextUrl.search,
      );
      const redirect = NextResponse.redirect(onboarding);
      setNoStore(redirect);
      return carryCookies(response, redirect);
    }
  }

  setNoStore(response);
  return response;
}

async function handleAdminRequest(req: NextRequest): Promise<NextResponse> {
  if (isPrepAuthBypassEnabled()) {
    const res = NextResponse.next();
    setNoStore(res);
    return res;
  }
  const { user, response } = await getPrepUserFromMiddleware(req);
  if (!user) {
    const login = new URL("/prep/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname);
    const redirect = NextResponse.redirect(login);
    setNoStore(redirect);
    return carryCookies(response, redirect);
  }
  if (!isPrepAdminUser(user)) {
    // Not back to login: the login form forwards a signed-in visitor to `next`,
    // which was this page, and the two redirected to each other forever.
    const redirect = NextResponse.redirect(new URL("/prep/admin-denied", req.url));
    setNoStore(redirect);
    return carryCookies(response, redirect);
  }
  setNoStore(response);
  return response;
}

/** `/prep/*` Supabase session + learning routes `/lesson`, `/quiz`, `/results`. */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith("/prep")) {
    if (path.startsWith("/prep/admin")) {
      return handleAdminRequest(req);
    }
    if (isPrepPublicPath(path)) {
      const res = NextResponse.next();
      if (isPrepCacheablePath(path)) setPublicCache(res);
      else setNoStore(res);
      return res;
    }
    if (isPrepSessionRequiredPath(path)) {
      // The whole course needs an account, the free intro module included
      // (free means no payment, not no login). Signed-out visitors get the login
      // page and come back here through `next`.
      return handlePrepAuthenticatedRequest(req);
    }
    const res = NextResponse.next();
    setNoStore(res);
    return res;
  }

  if (path.startsWith("/lesson") || path.startsWith("/quiz") || path.startsWith("/results")) {
    return handlePrepAuthenticatedRequest(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon\\.ico|.*\\..*|robots\\.txt|sitemap\\.xml|llms\\.txt).*)"],
};
