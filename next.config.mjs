import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy slug → hub (info / demo / sample tabs).
      { source: "/prep/amirant/info", destination: "/prep/amirant?tab=info", permanent: false },
      { source: "/prep/amirant/info/:path*", destination: "/prep/amirant?tab=info", permanent: false },
      { source: "/prep/amirant/demo", destination: "/prep/amirant?tab=sample", permanent: false },
      { source: "/prep/amirant/demo/:path*", destination: "/prep/amirant?tab=sample", permanent: false },
      { source: "/prep/study-usa", destination: "/prep/amirant", permanent: true },
      { source: "/prep/study-usa/:path*", destination: "/prep/amirant", permanent: true },
      // Legacy learn/practice/materials → full course app.
      { source: "/prep/amirant/practice", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/practice/:path*", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/learn", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/learn/:path*", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/materials", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/materials/:path*", destination: "/prep/amirant/course", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  disableLogger: true,
});
