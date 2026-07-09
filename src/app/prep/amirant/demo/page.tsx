import type { Metadata } from "next";
import { AmirantDemoExperience } from "@/components/prep/amirant-demo/AmirantDemoExperience";

export const metadata: Metadata = {
  title: "אמירנט - קורס הכנה (סילבוס + דמו)",
  description:
    "מבנה קורס לפי סילבוס מאל״ו, בנק 23 שאלות, תרגול אדפטיבי קצר (10 שאלות) ומבחן סימולציה מלא (פיילוט + 16 שאלות ציון ב־39 דק׳). דשבורד, וידאו, AI ודוחות - ללא שרת.",
};

export default function AmirantDemoPage() {
  return <AmirantDemoExperience />;
}
