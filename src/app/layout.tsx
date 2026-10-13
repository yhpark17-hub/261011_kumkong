import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GradientMesh } from "@/components/layout/GradientMesh";
import { FeedbackFab, FeedbackHost } from "@/components/feedback/Feedback";
import { Tracker } from "@/components/analytics/Tracker";
import { ADSENSE_CLIENT, SITE } from "@/lib/site";

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
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
  alternates: { canonical: "/" },
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
