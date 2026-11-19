/**
 * Social apps open ad links in their own embedded browser. Google refuses OAuth
 * there ("disallowed_useragent"), so a visitor from an Instagram or Facebook ad
 * who is sent to Google lands on an error page with no way forward. In these
 * browsers the email code is the sign-in path.
 */
const IN_APP_UA = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|musical_ly|BytedanceWebview|TikTok|Snapchat|LinkedInApp|Line\//i;

export function isInAppBrowserUserAgent(userAgent: string | null | undefined): boolean {
  return Boolean(userAgent && IN_APP_UA.test(userAgent));
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return isInAppBrowserUserAgent(navigator.userAgent);
}
