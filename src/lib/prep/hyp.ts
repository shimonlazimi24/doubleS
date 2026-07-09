/**
 * אינטגרציית סליקה מול Hyp (Yaad Sarig) - שרת בלבד.
 *
 * זרימה:
 * 1. `createHypPaymentUrl` - חתימה שרתית (action=APISign&What=SIGN עם KEY+PassP)
 *    מול https://pay.hyp.co.il/p3/ ומקבלים querystring חתום לדף התשלום המתארח.
 * 2. הלקוח משלם בדף של Hyp ומוחזר לכתובת ההצלחה/שגיאה שמוגדרת בפורטל Hyp
 *    (יש להגדיר בפורטל: /api/prep/checkout/callback) עם פרמטרי העסקה + Sign.
 * 3. `verifyHypCallback` - אימות HMAC-SHA256 מקומי של הפרמטרים (בסדר הקנוני של
 *    Yaad) ואופציונלית אימות roundtrip‏ (What=VERIFY) מול השרת של Hyp.
 *
 * משתני סביבה: HYP_MASOF (מספר מסוף), HYP_API_KEY, HYP_PASSP,
 * HYP_STRICT_VERIFY=1 (אימות roundtrip נוסף), HYP_API_BASE (ברירת מחדל p3).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_API_BASE = "https://pay.hyp.co.il/p3/";

export function isHypConfigured(): boolean {
  return Boolean(
    process.env.HYP_MASOF?.trim() && process.env.HYP_API_KEY?.trim() && process.env.HYP_PASSP?.trim(),
  );
}

function hypApiBase(): string {
  return process.env.HYP_API_BASE?.trim() || DEFAULT_API_BASE;
}

/** rawurlencode של PHP - כמו encodeURIComponent אבל מקודד גם !*'() */
function phpRawUrlEncode(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export type HypCreatePaymentParams = {
  /** הערך שיחזור בשדה Order בקולבק - מזהה רשומת התשלום אצלנו (אקראי). */
  orderRef: string;
  amountNis: number;
  /** תיאור העסקה (Info) - מופיע ללקוח ובפורטל. */
  description: string;
  clientName?: string;
  email?: string;
};

/**
 * בונה URL חתום לדף התשלום המתארח של Hyp.
 * זורק שגיאה אם החתימה נכשלת - אין fallback שקט.
 */
export async function createHypPaymentUrl(params: HypCreatePaymentParams): Promise<string> {
  const masof = process.env.HYP_MASOF?.trim();
  const apiKey = process.env.HYP_API_KEY?.trim();
  const passP = process.env.HYP_PASSP?.trim();
  if (!masof || !apiKey || !passP) {
    throw new Error("Hyp is not configured (HYP_MASOF / HYP_API_KEY / HYP_PASSP)");
  }

  const payParams = new URLSearchParams({
    action: "APISign",
    What: "SIGN",
    KEY: apiKey,
    PassP: passP,
    Masof: masof,
    Info: params.description,
    Amount: String(params.amountNis),
    Order: params.orderRef,
    UTF8: "True",
    UTF8out: "True",
    Coin: "1", // ₪
    PageLang: "HEB",
    MoreData: "True",
    sendemail: "True",
    Sign: "True",
  });
  if (params.clientName) payParams.set("ClientName", params.clientName);
  if (params.email) payParams.set("email", params.email);

  const signUrl = `${hypApiBase()}?${payParams.toString()}`;
  const res = await fetch(signUrl, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Hyp APISign SIGN failed: HTTP ${res.status}`);
  }
  const signedQuery = (await res.text()).trim();
  // התשובה היא querystring חתום (Masof=..&Info=..&...&signature=..)
  if (!signedQuery || !/signature=/i.test(signedQuery)) {
    throw new Error(`Hyp APISign SIGN returned unexpected payload: ${signedQuery.slice(0, 120)}`);
  }
  return `${hypApiBase()}?action=pay&${signedQuery}`;
}

export type HypCallbackVerification = {
  ok: boolean;
  /** מזהה עסקה בפורטל Hyp. */
  transactionId: string | null;
  /** קוד תשובה: "0" = הצלחה. */
  ccode: string | null;
  /** קוד אישור חברת אשראי. */
  acode: string | null;
  /** הסכום כפי שחזר מהקולבק (בש"ח). */
  amountNis: number | null;
  /** ה-Order ששלחנו (order_ref של רשומת התשלום). */
  orderRef: string | null;
  /** כל הפרמטרים - לשמירה ב-raw_callback. */
  raw: Record<string, string>;
  failureReason?: string;
};

/** הסדר הקנוני של שדות ה-Sign בקולבק של Yaad/Hyp (Sign עצמו לא נכלל). */
const SIGN_FIELD_ORDER = ["Id", "CCode", "Amount", "ACode", "Order", "Fild1", "Fild2", "Fild3"] as const;

function buildSignBase(params: Record<string, string>): string {
  const parts: string[] = [];
  if (params.HKId != null && params.HKId !== "") {
    parts.push(`HKId=${phpRawUrlEncode(params.HKId)}`);
  }
  for (const key of SIGN_FIELD_ORDER) {
    parts.push(`${key}=${phpRawUrlEncode(params[key] ?? "")}`);
  }
  return parts.join("&");
}

function localSignatureValid(params: Record<string, string>, apiKey: string): boolean {
  const sign = params.Sign;
  if (!sign) return false;
  const expected = createHmac("sha256", apiKey).update(buildSignBase(params)).digest("hex");
  const a = Buffer.from(expected.toLowerCase(), "utf8");
  const b = Buffer.from(sign.toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** אימות roundtrip מול Hyp: מחזירים את כל פרמטרי הקולבק עם What=VERIFY; CCode=0 = חתימה תקינה. */
async function remoteVerifyValid(params: Record<string, string>): Promise<boolean> {
  const masof = process.env.HYP_MASOF?.trim();
  const apiKey = process.env.HYP_API_KEY?.trim();
  const passP = process.env.HYP_PASSP?.trim();
  if (!masof || !apiKey || !passP) return false;
  const qs = new URLSearchParams({
    action: "APISign",
    What: "VERIFY",
    KEY: apiKey,
    PassP: passP,
    Masof: masof,
  });
  for (const [k, v] of Object.entries(params)) {
    if (!qs.has(k)) qs.set(k, v);
  }
  try {
    const res = await fetch(`${hypApiBase()}?${qs.toString()}`, { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const body = (await res.text()).trim();
    const answer = new URLSearchParams(body);
    return answer.get("CCode") === "0";
  } catch {
    return false;
  }
}

/**
 * מאמת קולבק תשלום מ-Hyp. `ok` = החתימה אומתה (לא אומר שהעסקה הצליחה -
 * לבדוק `ccode === "0"` בנפרד).
 */
export async function verifyHypCallback(searchParams: URLSearchParams): Promise<HypCallbackVerification> {
  const raw: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    raw[k] = v;
  });

  const apiKey = process.env.HYP_API_KEY?.trim();
  const base: Omit<HypCallbackVerification, "ok" | "failureReason"> = {
    transactionId: raw.Id ?? null,
    ccode: raw.CCode ?? null,
    acode: raw.ACode ?? null,
    amountNis: raw.Amount != null && raw.Amount !== "" ? Number(raw.Amount) : null,
    orderRef: raw.Order ?? null,
    raw,
  };
  if (!apiKey) {
    return { ...base, ok: false, failureReason: "hyp_not_configured" };
  }

  const strict = process.env.HYP_STRICT_VERIFY === "1";
  const hasLocalSign = Boolean(raw.Sign);
  const localOk = hasLocalSign ? localSignatureValid(raw, apiKey) : false;

  // fail-fast: Sign מקומי שגוי = דחייה מיידית, בלי לבזבז roundtrip ל-Hyp
  // (גם מונע מ-bots שמפציצים את ה-callback להפוך אותנו למתווך מול APISign).
  if (hasLocalSign && !localOk) {
    return { ...base, ok: false, failureReason: "signature_mismatch" };
  }

  if (strict) {
    // מצב מחמיר: גם roundtrip חובה בנוסף לחתימה המקומית.
    const remoteOk = await remoteVerifyValid(raw);
    if (!remoteOk) return { ...base, ok: false, failureReason: "remote_verify_failed" };
    return { ...base, ok: true };
  }

  // מצב רגיל: Sign מקומי תקין מספיק; בלעדיו - roundtrip.
  if (localOk) return { ...base, ok: true };
  const remoteOk = await remoteVerifyValid(raw);
  if (remoteOk) return { ...base, ok: true };
  return { ...base, ok: false, failureReason: "no_signature" };
}
