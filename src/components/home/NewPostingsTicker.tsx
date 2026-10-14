import Link from "next/link";
import { connection } from "next/server";
import { Megaphone } from "lucide-react";
import { ddayLabel, diffDays, todayKST } from "@/lib/date";
import { newPostings, type NewPosting } from "@/lib/postings";

/** 공고명은 띠에 맞게 짧게 (괄호 속 설명 등 생략) */
function shortTitle(title: string): string {
  const t = title.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  return t.length > 30 ? `${t.slice(0, 29)}…` : t;
}

function Item({ p, today, hidden = false }: { p: NewPosting; today: string; hidden?: boolean }) {
  const left = p.docDate ? diffDays(today, p.docDate) : null;
  return (
    <Link
      href={`/companies/${p.companyId}`}
      tabIndex={hidden ? -1 : undefined}
      className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap hover:underline"
    >
      {p.fresh && <span className="rounded-full bg-ruby px-1.5 py-px text-[10px] leading-4 font-semibold text-on-primary">NEW</span>}
      <span className="font-semibold text-on-primary">{p.name}</span>
      <span className="text-on-primary/75">{shortTitle(p.title)}</span>
      {p.docDate && left != null && left >= 0 && (
        <span className="rounded-full bg-on-primary/12 px-2 py-px tabular text-on-primary/90">
          서류 마감 {p.docDate.slice(5).replace("-", ".")}
          {p.docTime ? ` ${p.docTime}` : ""} · {ddayLabel(left)}
        </span>
      )}
    </Link>
  );
}

/** 홈 맨 위: 새로 뜬 채용 공고가 천천히 흐르는 얇은 띠 */
export async function NewPostingsTicker() {
  await connection();
  const today = todayKST();
  const items = newPostings(today);
  if (!items.length) return null;
  // 항목이 적으면 띠가 비어 보이지 않게 반복
  const loop = items.length < 4 ? [...items, ...items, ...items].slice(0, Math.max(4, items.length)) : items;
  const duration = Math.max(28, loop.length * 7);

  return (
    <section aria-label="신규 채용 공고" className="kk-ticker relative flex h-9 items-center overflow-hidden bg-brand-dark type-caption">
      <span className="relative z-10 flex h-full shrink-0 items-center gap-1.5 bg-brand-dark pr-3 pl-4 font-semibold text-on-primary md:pl-6">
        <Megaphone className="h-3.5 w-3.5 text-[var(--sherbet)]" strokeWidth={2} />
        신규 공고
        <span className="tabular font-normal text-on-primary/60">{items.length}</span>
      </span>
      <div className="kk-ticker-viewport no-scrollbar relative h-full min-w-0 flex-1 overflow-hidden">
        <div className="kk-marquee flex h-full w-max items-center" style={{ animationDuration: `${duration}s` }}>
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1 || undefined} className="flex shrink-0 items-center gap-10 pr-10">
              {loop.map((p, i) => (
                <Item key={`${p.companyId}-${i}`} p={p} today={today} hidden={copy === 1} />
              ))}
            </div>
          ))}
        </div>
        {/* 양 끝 흐림 */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-brand-dark to-transparent" />
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-brand-dark to-transparent" />
      </div>
    </section>
  );
}

export function NewPostingsTickerSkeleton() {
  return <div aria-hidden className="h-9 bg-brand-dark" />;
}
