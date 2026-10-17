import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 게시판·후기 DB 드라이버(네이티브 모듈)는 번들하지 않고 Node 에서 직접 불러옵니다.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // 공유 썸네일(opengraph-image)이 그릴 때 읽는 글꼴·기관 로고를 서버 함수에 함께 담아요
  outputFileTracingIncludes: {
    "/reviews/**": ["./node_modules/pretendard/dist/public/static/Pretendard-{Regular,Bold,ExtraBold}.otf", "./public/logos/**/*.png"],
    "/magazine/letter/**": ["./node_modules/pretendard/dist/public/static/Pretendard-{Regular,Bold,ExtraBold}.otf"],
  },
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
