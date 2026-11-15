import Link from "next/link";
import { connection } from "next/server";
import { ddayLabel, diffDays, formatShort, todayKST } from "@/lib/date";
import { newPostings, type NewPosting } from "@/lib/postings";
import { cn } from "../ui";

/** 공고명은 한 줄에 맞게 짧게 (괄호 속 설명 등 생략) */
function shortTitle(title: string): string {
  const t = title.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  return t.length > 30 ? `${t.slice(0, 29)}…` : t;
}

function Item({ p, today }: { p: NewPosting; today: string }) {
  const left = p.docDate ? diffDays(today, p.docDate) : null;
  return (
    <Link href={`/companies/${p.companyId}`} className="group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap type-caption text-ink-secondary">
      {p.fresh && <span className="rounded-[4px] bg-ruby px-1.5 py-px text-[10px] leading-4 font-bold text-on-primary">NEW</span>}
      <span className="font-bold text-ink group-hover:underline">{p.name}</span>
      <span>{shortTitle(p.title)}</span>
      {p.docDate && left != null && left >= 0 && (
        <span className="tabular">
          · 서류 마감 {formatShort(p.docDate)}
          {p.docTime ? ` ${p.docTime}` : ""} <b className={cn("font-extrabold", left <= 3 ? "text-ev-doc" : "text-ink")}>{ddayLabel(left)}</b>
        </span>
      )}
    </Link>
  );
}

/**
 * 새로 뜬 채용 공고 — 흰 판 한 줄 (채용 캘린더 머리 아래).
 * 예전엔 검은 띠가 흘러갔는데, 이제는 멈춰 있는 한 줄 · 넘치면 옆으로 밀어 봐요.
 */
export async function NewPostingsTicker() {
  await connection();
  const today = todayKST();
  const items = newPostings(today);
  if (!items.length) return null;

  return (
    <section aria-label="신규 채용 공고" className="mx-auto max-w-[1200px] px-4 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-hairline bg-canvas py-2.5 pr-1 pl-4">
        <span className="inline-flex shrink-0 items-center gap-1.5 type-caption font-extrabold text-accent-text">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          새 공고 <span className="tabular">{items.length}</span>
        </span>
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-6 overflow-x-auto pr-8 [mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)]">
          {items.map((p, i) => (
            <Item key={`${p.companyId}-${i}`} p={p} today={today} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function NewPostingsTickerSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-[1200px] px-4 pt-4 md:px-6 md:pt-6">
      <div className="h-[44px] rounded-xl border border-hairline bg-canvas" />
    </div>
  );
}
