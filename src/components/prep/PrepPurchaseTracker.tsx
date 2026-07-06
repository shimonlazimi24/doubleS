"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/prep/analytics";

/** אירוע purchase בדף ההצלחה — dedupe לפי order_ref (ריענון לא סופר פעמיים). */
export function PrepPurchaseTracker({
  orderRef,
  planId,
  amountNis,
}: {
  orderRef: string;
  planId: string;
  amountNis: number;
}) {
  useEffect(() => {
    try {
      const key = `prep-purchase-tracked-${orderRef}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage חסום — עדיין שולחים */
    }
    trackEvent("purchase", { plan: planId, value: amountNis, currency: "ILS", order: orderRef });
  }, [orderRef, planId, amountNis]);
  return null;
}
