"use client";

/**
 * Minimal toast for learner-facing feedback (no toast library in the app).
 * Keeps copy Hebrew and non-technical.
 */

const TOAST_HOST_ID = "prep-toast-host";

function ensureHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let host = document.getElementById(TOAST_HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = TOAST_HOST_ID;
    host.setAttribute("dir", "rtl");
    host.style.cssText =
      "position:fixed;z-index:9999;bottom:1.25rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:0.5rem;max-width:min(22rem,92vw);pointer-events:none;";
    document.body.appendChild(host);
  }
  return host;
}

export function showPrepToast(
  message: string,
  opts?: { tone?: "info" | "error" | "success"; ms?: number },
): void {
  const host = ensureHost();
  if (!host) return;
  const tone = opts?.tone ?? "info";
  const ms = opts?.ms ?? 4500;
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  const bg =
    tone === "error" ? "#7f1d1d" : tone === "success" ? "#14532d" : "#0f172a";
  el.style.cssText = `pointer-events:auto;padding:0.75rem 1rem;border-radius:0.75rem;background:${bg};color:#f8fafc;font-size:0.875rem;line-height:1.4;box-shadow:0 8px 24px rgba(0,0,0,0.18);`;
  el.textContent = message;
  host.appendChild(el);
  window.setTimeout(() => {
    el.remove();
    if (host.childElementCount === 0) host.remove();
  }, ms);
}
