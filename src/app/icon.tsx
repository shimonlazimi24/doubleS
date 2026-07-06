import { ImageResponse } from "next/og";

/** Favicon ריבועי — נוצר בזמן build (מחליף JPEG לא-ריבועי עם רקע משבצות). */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f2347",
          borderRadius: 14,
          color: "#ffffff",
          fontSize: 40,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
        }}
      >
        p
      </div>
    ),
    size,
  );
}
