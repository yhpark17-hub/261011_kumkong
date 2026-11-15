import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "../ui";

/** 홈 구역 제목 — 굵은 제목 + (컴퓨터) 한 줄 설명 + 오른쪽 '전체' 또는 바로가기 몇 개 */
export function SectionHead({
  id,
  title,
  meta,
  more,
  links,
}: {
  id: string;
  title: string;
  meta?: string;
  more?: { href: string; label?: string };
  /** 컴퓨터에서 '전체' 대신 보여 줄 바로가기 (휴대폰은 more 하나만) */
  links?: { href: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-3">
      <h2 id={id} className="text-[19px] font-extrabold tracking-[-0.035em] text-ink md:text-[22px]">
        {title}
      </h2>
      {meta && <span className="hidden text-[14px] font-medium text-ink-mute md:inline">{meta}</span>}
      {more && (
        <Link href={more.href} className={cn("ml-auto flex items-center gap-0.5 text-[13.5px] font-bold text-ink-mute hover:text-ink md:text-[14px] md:text-ink-secondary", links && "md:hidden")}>
          {more.label ?? "전체"} <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
        </Link>
      )}
      {links && (
        <span className="ml-auto hidden gap-2 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex h-[34px] items-center gap-0.5 rounded-full border border-hairline bg-canvas-soft px-3.5 text-[13.5px] font-bold text-ink-secondary transition-colors hover:border-primary/30 hover:text-brand-text"
            >
              {l.label} <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.6} />
            </Link>
          ))}
        </span>
      )}
    </div>
  );
}

/** 목록 아래 옅은 보라 한 줄 링크 (후기 남기기 · 글쓰기) */
export function SoftLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-3 flex h-[50px] items-center justify-between gap-3 rounded-2xl bg-tag-soft-bg px-[18px] text-[13.5px] font-semibold text-primary-text transition-colors hover:bg-[color-mix(in_srgb,var(--tag-soft-bg)_80%,var(--primary-subdued))] md:h-[52px] md:px-5 md:text-[14px]"
    >
      <span className="min-w-0 truncate">{children}</span>
      <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2.6} />
    </Link>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 rounded-md bg-canvas-soft" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-12 rounded-md bg-canvas-soft" />
        ))}
      </div>
    </div>
  );
}
