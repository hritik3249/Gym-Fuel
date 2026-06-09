/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 15 defaulted staleTimes.dynamic to 0 (no cache), making every
    // tab switch re-render on the server even if you just visited it.
    // 30s cache means repeat visits within 30 s are served from the router
    // cache instantly. revalidatePath() calls in server actions still bust
    // individual routes immediately after data changes.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate"
          },
          {
            key: "Service-Worker-Allowed",
            value: "/"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
