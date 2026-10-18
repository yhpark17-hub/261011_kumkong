import Link from "next/link";
import { BarChart3, BookOpen, Building2, CalendarDays, MessagesSquare, Newspaper } from "lucide-react";
import { BOARD_NAME } from "@/lib/board-meta";

const ITEMS = [
  { href: "/calendar", label: "캘린더", Icon: CalendarDays, tone: "bg-ev-doc-soft text-ev-doc" },
  { href: "/reviews", label: "필기 후기", Icon: BarChart3, tone: "bg-ev-written-soft text-ev-written" },
  { href: "/magazine", label: "브리핑", Icon: Newspaper, tone: "bg-ev-interview1-soft text-ev-interview1" },
  { href: "/magazine/blog", label: "블로그", Icon: BookOpen, tone: "bg-ev-final-soft text-ev-final" },
  { href: "/companies", label: "기관 정보", Icon: Building2, tone: "bg-ev-interview2-soft text-ev-interview2" },
  { href: "/board", label: BOARD_NAME, Icon: MessagesSquare, tone: "bg-ev-posting-soft text-ev-posting" },
] as const;

/**
 * 홈: 섹션 바로가기 (휴대폰만 — PC 는 위 메뉴)
 * 토스 앱처럼 한 줄 아이콘: 둥근 네모 아이콘 + 짧은 이름, 테두리·그림자 없이 가볍게 (DESIGN-MOBILE.md)
 */
export function QuickMenu() {
  return (
    <nav aria-label="바로가기" className="grid grid-cols-6 rounded-2xl bg-canvas/85 px-1 py-3 shadow-level-1 backdrop-blur md:hidden">
      {ITEMS.map(({ href, label, Icon, tone }) => (
        <Link key={href} href={href} className="group flex flex-col items-center gap-1.5 rounded-xl py-1 active:bg-canvas-soft">
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-[14px] transition-transform group-active:scale-95 ${tone}`}>
            <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
          </span>
          <span className="text-[12px] leading-4 font-semibold whitespace-nowrap text-ink-secondary">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
