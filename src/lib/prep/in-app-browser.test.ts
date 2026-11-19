import { describe, expect, it } from "vitest";
import { isInAppBrowserUserAgent } from "./in-app-browser";

const INSTAGRAM_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 335.0.0.28.90 (iPhone15,2; iOS 17_5; he_IL; he; scale=3.00; 1179x2556; 610945153)";
const FACEBOOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/470.0.0.37.108;]";
const TIKTOK_ANDROID =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 musical_ly_2023405030 BytedanceWebview/d8a21c6";
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

describe("isInAppBrowserUserAgent", () => {
  it("flags the embedded browsers of social apps", () => {
    expect(isInAppBrowserUserAgent(INSTAGRAM_IOS)).toBe(true);
    expect(isInAppBrowserUserAgent(FACEBOOK_ANDROID)).toBe(true);
    expect(isInAppBrowserUserAgent(TIKTOK_ANDROID)).toBe(true);
  });

  it("leaves real browsers alone", () => {
    expect(isInAppBrowserUserAgent(SAFARI_IOS)).toBe(false);
    expect(isInAppBrowserUserAgent(CHROME_ANDROID)).toBe(false);
    expect(isInAppBrowserUserAgent(CHROME_DESKTOP)).toBe(false);
    expect(isInAppBrowserUserAgent(null)).toBe(false);
  });
});
