import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Keep one user-facing Amirant entry point.
      { source: "/prep/amirant", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/study-usa", destination: "/prep/amirant/course", permanent: true },
      { source: "/prep/study-usa/:path*", destination: "/prep/amirant/course", permanent: true },
      // Legacy/demo/materials/info paths are intentionally non-canonical.
      { source: "/prep/amirant/demo", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/demo/:path*", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/info", destination: "/prep/amirant/course", permanent: false },
      { source: "/prep/amirant/info/:path*", destination: "/prep/amirant/course", permanent: false },
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
