import type { NextConfig } from "next";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Stable across build/start and all instances using the same source snapshot.
// Protects an already-open booking page when a deployment replaces its chunks.
function sourceDeploymentId() {
  const hash = createHash("sha256");
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(?:ts|tsx|css|woff2)$/.test(entry.name)) {
        const contents = readFileSync(path);
        hash.update(path.replaceAll("\\", "/")).update(entry.name.endsWith(".woff2") ? contents : contents.toString("utf8").replaceAll("\r\n", "\n"));
      }
    }
  }
  visit("src");
  hash.update(readFileSync("package-lock.json", "utf8").replaceAll("\r\n", "\n"));
  return hash.digest("hex").slice(0, 20);
}

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://apis.google.com https://connect.facebook.net https://www.googletagmanager.com https://*.google-analytics.com https://*.googleadservices.com https://*.doubleclick.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://admin.grahakavach.in https://grahakavach.in https://*.gravatar.com https://*.razorpay.com https://www.facebook.com https://www.googletagmanager.com https://*.google-analytics.com https://*.googletagmanager.com https://*.doubleclick.net https://www.google.com https://www.google.co.in;
  connect-src 'self' https://admin.grahakavach.in https://api.razorpay.com https://lumberjack.razorpay.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://www.google.com https://firebaseinstallations.googleapis.com https://www.facebook.com https://connect.facebook.net https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://www.google.co.in https://*.googleadservices.com;
  frame-src 'self' https://*.doubleclick.net https://api.razorpay.com https://*.razorpay.com https://maps.google.com https://www.google.com https://recaptcha.google.com https://*.firebaseapp.com https://www.googletagmanager.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.razorpay.com;
  frame-ancestors 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || process.env.GITHUB_SHA || process.env.VERCEL_GIT_COMMIT_SHA || sourceDeploymentId(),
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  // The shared host reports ~53 CPUs, so Next spawned 53 build workers: that exhausted the
  // 3 GB memory limit and flooded WordPress with parallel requests (503). Keep the build small.
  experimental: {
    cpus: 2,
    workerThreads: false,
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 3,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.grahakavach.in",
      },
      {
        protocol: "https",
        hostname: "grahakavach.in",
      },
    ],
  },
  async redirects() {
    const host = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://grahakavach.in").host.replace(/^www\./, "");

    return [
      // One canonical host: www.* answered 200 with a full duplicate of every page.
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: `www.${host}` }],
        destination: `https://${host}/:path*`,
        permanent: true,
      },
      // The CMS calls the home page "/home"; on this storefront it is "/".
      { source: "/home", destination: "/", permanent: true },
      // There is no paginated blog yet: /blog/page/2 used to 307 to the home page.
      { source: "/blog/page/:page", destination: "/blog", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
