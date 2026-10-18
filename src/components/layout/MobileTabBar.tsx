"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { BarChart3, CalendarDays, House, MessagesSquare, Newspaper } from "lucide-react";
import { BOARD_NAME } from "@/lib/board-meta";
import { cn } from "../ui";

const TABS = [
  { href: "/", label: "홈", Icon: House },
  { href: "/calendar", label: "캘린더", Icon: CalendarDays },
  { href: "/reviews", label: "필기 후기", Icon: BarChart3 },
  { href: "/magazine", label: "시사 뉴스", Icon: Newspaper },
  { href: "/board", label: BOARD_NAME, Icon: MessagesSquare },
] as const;

const isActive = (pathname: string | null, href: string) =>
  !!pathname && (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

function Tabs({ pathname }: { pathname: string | null }) {
  // 운영자 화면에서는 숨김
  if (pathname?.startsWith("/admin")) return null;
  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, Icon }) => {
          const on = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn("flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] leading-4", on ? "font-semibold text-primary-text" : "text-ink-mute")}
              >
                <Icon className="h-5 w-5" strokeWidth={on ? 2.2 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveTabs() {
  return <Tabs pathname={usePathname()} />;
}

/** 휴대폰 하단 고정 탭 — 어느 화면에서든 홈·캘린더·후기·브리핑·콩밭으로 바로 */
export function MobileTabBar() {
  return (
    <>
      {/* 탭에 가려지지 않게 페이지 끝에 같은 높이만큼 여백 */}
      <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <Suspense fallback={<Tabs pathname={null} />}>
        <ActiveTabs />
      </Suspense>
    </>
  );
}
