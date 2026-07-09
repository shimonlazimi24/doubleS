import { ImageResponse } from "next/og";

/** תמונת OG 1200×630 - נוצרת בזמן build עם צבעי המותג (מחליפה JPEG 1024×576 עם רקע משבצות). */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PREPARE - הכנה לאמירנט";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f2347 0%, #16306a 100%)",
          color: "#ffffff",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: 6,
            fontFamily: "Georgia, serif",
            display: "flex",
          }}
        >
          prepare
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 44,
            color: "#bcd3f7",
            display: "flex",
          }}
        >
          הכנה לאמירנט - קורס דיגיטלי מלא
        </div>
        <div
          style={{
            marginTop: 44,
            display: "flex",
            gap: 18,
            fontSize: 26,
            color: "#0f2347",
          }}
        >
          <div style={{ background: "#d4a843", borderRadius: 999, padding: "10px 28px", display: "flex" }}>
            מבחן רמה 50–150
          </div>
          <div style={{ background: "#ffffff", borderRadius: 999, padding: "10px 28px", display: "flex" }}>
            עוזר AI אישי
          </div>
          <div style={{ background: "#ffffff", borderRadius: 999, padding: "10px 28px", display: "flex" }}>
            סימולציות אמת
          </div>
        </div>
      </div>
    ),
    size,
  );
}
