import Link from "next/link";
import { BarChart3, BookOpen, Building2, CalendarDays, MessagesSquare, Newspaper } from "lucide-react";
import { BOARD_NAME } from "@/lib/board-meta";

const ITEMS = [
  { href: "/calendar", label: "채용 캘린더", hint: "서류·필기·면접 일정", Icon: CalendarDays, tone: "bg-ev-doc-soft text-ev-doc" },
  { href: "/reviews", label: "필기 후기", hint: "체감 난이도 투표", Icon: BarChart3, tone: "bg-ev-written-soft text-ev-written" },
  { href: "/magazine", label: "데일리 브리핑", hint: "오늘의 금융 뉴스", Icon: Newspaper, tone: "bg-ev-interview1-soft text-ev-interview1" },
  { href: "/magazine/blog", label: "금융 블로그", hint: "필기·면접 가이드", Icon: BookOpen, tone: "bg-ev-final-soft text-ev-final" },
  { href: "/companies", label: "기관 정보", hint: "필기 유형·경쟁률", Icon: Building2, tone: "bg-ev-interview2-soft text-ev-interview2" },
  { href: "/board", label: BOARD_NAME, hint: "준비생 익명 게시판", Icon: MessagesSquare, tone: "bg-ev-posting-soft text-ev-posting" },
] as const;

/** 홈: 섹션 바로가기 — 휴대폰 첫 화면에 다 보이게 3칸 × 2줄 (PC 는 위 메뉴로 충분해서 숨김) */
export function QuickMenu() {
  return (
    <nav aria-label="바로가기" className="grid grid-cols-3 gap-2 sm:gap-3 md:hidden">
      {ITEMS.map(({ href, label, hint, Icon, tone }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center gap-2 rounded-xl border border-hairline bg-canvas px-2 py-3.5 text-center shadow-level-1 transition-shadow hover:shadow-level-2 sm:py-4"
        >
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="type-body-md font-semibold text-ink [word-break:keep-all] group-hover:underline">{label}</span>
          <span className="hidden type-caption text-ink-mute sm:block">{hint}</span>
        </Link>
      ))}
    </nav>
  );
}
