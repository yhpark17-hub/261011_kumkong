import Image from "next/image";
import Link from "next/link";
import { BOARD_NAME } from "@/lib/board-meta";

const ITEMS = [
  { href: "/calendar", label: "채용 캘린더", sub: "서류부터 발표까지 한 달력에", img: "/illust/tile-calendar.webp" },
  { href: "/reviews", label: "필기 후기", sub: "응시자가 남긴 체감 난이도", img: "/illust/tile-exam.webp" },
  { href: "/magazine", label: "시사 뉴스", sub: "아침 브리핑 · 점심 3문제", img: "/illust/tile-news.webp" },
  { href: "/magazine/blog", label: "금융 블로그", sub: "필기·면접을 깊이 읽기", img: "/illust/tile-blog.webp" },
  { href: "/companies", label: "기관 정보", sub: "경쟁률·전형·자소서 항목", img: "/illust/tile-company.webp" },
  { href: "/board", label: BOARD_NAME, sub: "준비생끼리 묻고 답하기", img: "/illust/tile-board.webp" },
] as const;

/** 홈: 섹션 바로가기 — 브리핑과 같은 그림체의 작은 그림 타일 (휴대폰 3칸, PC 6칸) */
export function QuickMenu() {
  return (
    <nav aria-label="바로가기" className="grid grid-cols-3 gap-2.5 md:grid-cols-6 md:gap-3.5">
      {ITEMS.map(({ href, label, sub, img }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col gap-2 rounded-[20px] bg-canvas p-2 shadow-level-1 transition-shadow hover:shadow-level-2 md:gap-2.5 md:rounded-3xl md:p-3"
        >
          <span className="relative block aspect-[4/3] overflow-hidden rounded-[14px] md:rounded-2xl">
            <Image src={img} alt="" fill sizes="(min-width: 768px) 180px, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
          </span>
          <span className="px-0.5 pb-0.5">
            <span className="block text-center text-[13px] leading-5 font-bold whitespace-nowrap text-ink md:text-left md:text-[15px]">{label}</span>
            <span className="mt-0.5 hidden truncate type-caption text-ink-mute md:block">{sub}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
