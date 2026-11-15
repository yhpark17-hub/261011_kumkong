"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, useSyncExternalStore } from "react";
import { Menu, X } from "lucide-react";
import { FeedbackButton } from "../feedback/Feedback";
import { Logo, cn } from "../ui";

const NAV = [
  { href: "/calendar", label: "채용 캘린더" },
  { href: "/reviews", label: "필기 후기" },
  // 데일리 브리핑(시사·금융 뉴스)과 금융 블로그 — 예전 이름 '매거진'
  { href: "/magazine", label: "시사 뉴스" },
  { href: "/board", label: "콩밭" },
  { href: "/companies", label: "기관 정보·경쟁률" },
] as const;

/* 스크롤 위치: 휴대폰은 맨 위에서 선 없이, 내려가면 아래 선을 그어 본문과 나눠요 */
function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}
const getScrolled = () => window.scrollY > 8;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** 메뉴 링크 목록 — pathname 이 없으면(프리렌더 단계) 활성 표시 없이 그립니다 */
function NavItems({
  pathname,
  variant,
  onNavigate,
}: {
  pathname: string | null;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  if (variant === "desktop") {
    return NAV.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        aria-current={isActive(pathname, href) ? "page" : undefined}
        className={cn(
          // 지금 화면: 글자 아래 남색 밑줄 (위에도 같은 두께의 투명 선을 둬서 글자가 가운데에 오게)
          "flex items-center border-y-[3px] border-transparent text-[16px] leading-5 whitespace-nowrap transition-colors",
          isActive(pathname, href) ? "border-b-navy-text font-bold text-ink" : "font-semibold text-ink-mute-2 hover:text-ink",
        )}
      >
        {label}
      </Link>
    ));
  }
  return (
    <ul>
      {NAV.map(({ href, label }) => (
        <li key={href}>
          <Link
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-12 items-center gap-2 border-b border-hairline type-body-lg",
              isActive(pathname, href) ? "font-bold text-ink" : "text-ink",
            )}
          >
            {isActive(pathname, href) && <span aria-hidden className="h-4 w-[3px] rounded-full bg-navy-text" />}
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * 현재 경로를 읽는 부분만 따로 둡니다. 동적 경로(예: /board/[id])에서는
 * 경로가 요청 시점에야 정해지므로 Suspense 안에서 읽어야 프리렌더가 막히지 않습니다.
 */
function ActiveNavItems(props: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavItems pathname={pathname} {...props} />;
}

export function SiteHeader() {
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header
      data-app-hide
      data-site-header
      className={cn(
        "sticky top-0 z-30 border-b bg-canvas/95 backdrop-blur transition-colors duration-200",
        // 휴대폰은 맨 위에서 선 없이, 내려가면 선 — 컴퓨터는 늘 선
        scrolled || menuOpen ? "border-hairline" : "border-transparent md:border-hairline",
      )}
    >
      {/* 휴대폰 56px · 컴퓨터 68px */}
      <div className="mx-auto flex h-14 max-w-[1200px] items-stretch gap-10 px-4 md:h-[68px] md:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="금콩 홈" onClick={close}>
          <Logo className="h-8 w-8" />
          <span data-header-fg className="text-[22px] leading-none font-extrabold tracking-[-0.04em] text-ink md:text-[23px]">
            금콩
          </span>
        </Link>

        <nav className="hidden flex-1 items-stretch gap-6 md:flex lg:gap-8" aria-label="주요 메뉴">
          <Suspense fallback={<NavItems pathname={null} variant="desktop" />}>
            <ActiveNavItems variant="desktop" />
          </Suspense>
        </nav>

        <FeedbackButton kind="posting" className="btn btn-secondary btn-sm ml-auto hidden self-center lg:inline-flex">
          공고 제보하기
        </FeedbackButton>

        {/* 모바일: 햄버거 내비 */}
        <button
          type="button"
          data-header-fg
          className="btn btn-icon -mr-2 ml-auto self-center text-ink md:hidden"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-hairline bg-canvas px-4 pt-2 pb-6 md:hidden" aria-label="모바일 메뉴">
          <Suspense fallback={<NavItems pathname={null} variant="mobile" onNavigate={close} />}>
            <ActiveNavItems variant="mobile" onNavigate={close} />
          </Suspense>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <FeedbackButton kind="posting" onOpen={close} className="btn btn-primary">
              공고 제보하기
            </FeedbackButton>
            <FeedbackButton kind="site" onOpen={close} className="btn btn-toggle">
              의견 보내기
            </FeedbackButton>
          </div>
        </nav>
      )}
    </header>
  );
}
