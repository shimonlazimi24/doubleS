import { isPrepAdminUser } from "@/lib/prep/admin-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPrepAmirantCoursePublicPreviewPath } from "@/lib/prep/amirant-public-preview";
import { isPrepAuthBypassEnabled } from "@/lib/prep/auth-bypass";
import { isGoogleOAuthEnabledInApp } from "@/lib/prep/brand";
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
    // אנונימיים → ישר ל-Google; עמוד ה-login נשאר לשגיאות ולכניסה עם קוד מייל.
    const login = new URL(
      isGoogleOAuthEnabledInApp() ? "/prep/auth/google" : "/prep/login",
      req.url,
    );
    login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    setNoStore(redirect);
    return redirect;
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
      return redirect;
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
  const { user } = await getPrepUserFromMiddleware(req);
  if (!user || !isPrepAdminUser(user)) {
    const login = new URL("/prep/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname);
    const redirect = NextResponse.redirect(login);
    setNoStore(redirect);
    return redirect;
  }
  const res = NextResponse.next();
  setNoStore(res);
  return res;
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
      if (isPrepAmirantCoursePublicPreviewPath(path)) {
        const res = NextResponse.next();
        setNoStore(res);
        return res;
      }
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
