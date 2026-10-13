"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import {
  BarChart3,
  Ban,
  ClipboardList,
  Database,
  FileText,
  Flag,
  LayoutDashboard,
  MessageSquare,
  MessageSquareWarning,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../ui";

export const ADMIN_NAV: { href: string; label: string; icon: LucideIcon; group: string }[] = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, group: "개요" },
  { href: "/admin/analytics", label: "방문 통계", icon: BarChart3, group: "개요" },
  { href: "/admin/feedback", label: "제보·의견", icon: MessageSquareWarning, group: "받은 것" },
  { href: "/admin/reports", label: "신고", icon: Flag, group: "받은 것" },
  { href: "/admin/posts", label: "콩밭 글", icon: FileText, group: "콘텐츠" },
  { href: "/admin/comments", label: "댓글", icon: MessageSquare, group: "콘텐츠" },
  { href: "/admin/reviews", label: "필기 후기", icon: ClipboardList, group: "콘텐츠" },
  { href: "/admin/bans", label: "차단 목록", icon: Ban, group: "콘텐츠" },
  { href: "/admin/data", label: "일정 데이터 점검", icon: Database, group: "데이터" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function Items({ pathname }: { pathname: string | null }) {
  const groups = [...new Set(ADMIN_NAV.map((n) => n.group))];
  return (
    <>
      {/* 휴대폰: 가로로 넘기는 탭 */}
      <nav className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden" aria-label="운영자 메뉴">
        {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            className={cn("btn btn-sm shrink-0", isActive(pathname, href) ? "btn-on-dark" : "btn-toggle")}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>
      {/* PC: 왼쪽 메뉴 */}
      <nav className="hidden space-y-5 lg:block" aria-label="운영자 메뉴">
        {groups.map((g) => (
          <div key={g}>
            <p className="px-3 pb-1.5 type-micro-cap text-ink-mute">{g}</p>
            <ul className="space-y-0.5">
              {ADMIN_NAV.filter((n) => n.group === g).map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(pathname, href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 type-body-md transition-colors",
                      isActive(pathname, href)
                        ? "bg-brand-dark !font-normal text-on-primary"
                        : "text-ink-secondary hover:bg-canvas-soft hover:text-ink",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

function ActiveItems() {
  return <Items pathname={usePathname()} />;
}

export function AdminNav() {
  return (
    <Suspense fallback={<Items pathname={null} />}>
      <ActiveItems />
    </Suspense>
  );
}
