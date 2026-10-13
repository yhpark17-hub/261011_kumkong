import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 게시판·후기 DB 드라이버(네이티브 모듈)는 번들하지 않고 Node 에서 직접 불러옵니다.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // 필기 가이드는 매거진으로 옮김 — 예전 링크·검색 결과가 끊기지 않게
  redirects() {
    return [{ source: "/guide", destination: "/magazine", permanent: true }];
  },
  images: {
    // 업로드한 이미지(Vercel Blob)
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
