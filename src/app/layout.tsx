import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GradientMesh } from "@/components/layout/GradientMesh";
import { FeedbackFab, FeedbackHost } from "@/components/feedback/Feedback";
import { Tracker } from "@/components/analytics/Tracker";
import { ADSENSE_CLIENT, OG_IMAGE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    "금융공기업",
    "금공",
    "공기업 채용",
    "채용 달력",
    "A매치",
    "NCS",
    "한국은행 채용",
    "금감원 채용",
    "산업은행 채용",
    "신용보증기금 채용",
    "알리오 경쟁률",
    "자소서 항목",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [OG_IMAGE],
  },
  // 제목·설명·이미지는 페이지마다의 og:* 를 그대로 써요 (여기 적으면 모든 페이지가 사이트 기본값으로 공유됨)
  twitter: { card: "summary_large_image" },
  // 대표 주소(canonical)는 페이지마다 — 여기 두면 따로 안 정한 페이지가 '홈과 같은 페이지'로 알려져요
  // 검색 등록 소유 확인 (네이버 서치어드바이저) — 모든 페이지 <head> 에 들어가요
  verification: { other: { "naver-site-verification": "47e31a4fc989d1ce09c99baf2d0166d94731c709" } },
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1d31" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  alternateName: SITE.title,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "ko-KR",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="relative isolate flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GradientMesh />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <FeedbackFab />
        <FeedbackHost />
        <Tracker />
        {ADSENSE_CLIENT && (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
      </body>
    </html>
  );
}
