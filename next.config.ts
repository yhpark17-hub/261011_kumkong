import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 동적 페이지(브리핑·후기 등)의 og:* 는 기본적으로 '스트리밍'돼 <head> 가 아니라 본문 뒤에 붙어요.
  // 카톡 스크래퍼(kakaotalk-scrap)는 Next 기본 봇 목록에 없어서 썸네일을 못 읽었음 → 봇 목록을 직접 지정(기본 목록 + 국내 메신저·포털).
  // 이 옵션은 기본 목록을 '대체'하므로 Next 기본값도 함께 적어 둠.
  htmlLimitedBots:
    /kakaotalk-scrap|kakaotalk-agent|Kakao|Daum|Yeti|NaverBot|TelegramBot|Line\/|Pinterest|Googlebot|Mediapartners-Google|Chrome-Lighthouse|googleweblight|-Google|Google-|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview/i,
  // 게시판·후기 DB 드라이버(네이티브 모듈)는 번들하지 않고 Node 에서 직접 불러옵니다.
  serverExternalPackages: ["@libsql/client", "libsql"],
  // 공유 썸네일(opengraph-image)이 그릴 때 읽는 글꼴·기관 로고를 서버 함수에 함께 담아요
  outputFileTracingIncludes: {
    "/reviews/**": ["./node_modules/pretendard/dist/public/static/Pretendard-{Light,Regular,Bold,ExtraBold,Black}.otf", "./public/logos/**/*.png"],
    "/magazine/**": ["./node_modules/pretendard/dist/public/static/Pretendard-{Light,Regular,Bold,ExtraBold,Black}.otf", "./public/logos/**/*.png"],
    "/admin/news/**": ["./node_modules/pretendard/dist/public/static/Pretendard-{Light,Regular,Bold,ExtraBold,Black}.otf", "./public/logos/**/*.png"],
    "/api/automation/**": ["./node_modules/pretendard/dist/public/static/Pretendard-{Light,Regular,Bold,ExtraBold,Black}.otf"],
    // 앱 카드 그림 PNG (그림 속 이름띠 글자·기관 로고)
    "/api/app/**": ["./node_modules/pretendard/dist/public/static/Pretendard-{Light,Regular,Bold,ExtraBold,Black}.otf", "./public/logos/**/*.png"],
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
