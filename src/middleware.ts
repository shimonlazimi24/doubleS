import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPrepAmirantCoursePublicPreviewPath } from "@/lib/prep/amirant-public-preview";
import { isPrepAuthBypassEnabled } from "@/lib/prep/auth-bypass";
import { isPrepPublicPath } from "@/lib/prep/constants";
import {
  hasCompletedPrepOnboarding,
  isPrepOnboardingGatedPath,
  isPrepSessionRequiredPath,
  prepOnboardingRedirectUrl,
} from "@/lib/prep/onboarding/gate";
import { getPrepUserFromMiddleware } from "@/lib/prep/supabase/middleware";

function setNoStore(res: NextResponse): void {
  res.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate, max-age=0");
}

async function handlePrepAuthenticatedRequest(req: NextRequest): Promise<NextResponse> {
  if (isPrepAuthBypassEnabled()) {
    const res = NextResponse.next();
    setNoStore(res);
    return res;
  }

  const { user, response, supabase } = await getPrepUserFromMiddleware(req);
  if (!user) {
    const login = new URL("/prep/login", req.url);
    login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    setNoStore(redirect);
    return redirect;
  }

  if (isPrepOnboardingGatedPath(req.nextUrl.pathname) && supabase) {
    const completed = await hasCompletedPrepOnboarding(supabase, user.id);
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
  if (!user || user.user_metadata?.is_admin !== true) {
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
      setNoStore(res);
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
