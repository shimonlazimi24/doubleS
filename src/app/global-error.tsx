"use client";

/** Last-resort screen when the root layout itself fails; it replaces the layout, so it carries its own html/body and inline styles. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f7f8fb", color: "#0f2347" }}>
        <main style={{ maxWidth: "32rem", margin: "0 auto", padding: "6rem 1.5rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>משהו השתבש</h1>
          <p style={{ marginTop: "0.75rem", lineHeight: 1.7, color: "#4b5568" }}>
            נסו לטעון את העמוד שוב. אם זה חוזר, כתבו לנו ל-support@getprepared.academy.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              minHeight: "3rem",
              padding: "0 1.5rem",
              border: 0,
              borderRadius: "0.5rem",
              background: "#0f2347",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            לנסות שוב
          </button>
        </main>
      </body>
    </html>
  );
}
