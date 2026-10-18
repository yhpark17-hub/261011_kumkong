import Link from "next/link";
import { ArrowRight, Building2, MessagesSquare, PenLine } from "lucide-react";
import { CompanyAvatar, cn } from "@/components/ui";
import { parseKey } from "@/lib/date";
import type { ArticleCompany } from "@/lib/server/article-links";

/** '10.24 필기시험' */
function examTag(date: string, label: string): string {
  const { m, d } = parseKey(date);
  return `${m}.${d} ${label}`;
}

/** 글에 나온 기관으로 넘어가는 칸 — 기관 정보 · 필기 후기 · 실시간 톡 */
export function ArticleLinks({ items, className }: { items: ArticleCompany[]; className?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="article-links-title" className={cn("space-y-3", className)}>
      <h2 id="article-links-title" className="type-heading-sm text-ink">
        이 글과 관련된 곳
      </h2>
      {items.map(({ company: c, exam }) => {
        const links = [
          { href: `/companies/${c.id}`, Icon: Building2, label: `${c.shortName} 기관 정보`, note: "필기 구성·채용 일정·경쟁률" },
          ...(exam ? [{ href: `/reviews/${exam.id}`, Icon: PenLine, label: `${c.shortName} 필기 후기`, note: `${examTag(exam.date, exam.label)} 체감 난이도·후기` }] : []),
          { href: `/companies/${c.id}#talk`, Icon: MessagesSquare, label: `${c.shortName} 실시간 톡`, note: "응시자끼리 익명으로 바로바로" },
        ];
        return (
          <div key={c.id} className="rounded-2xl border border-hairline bg-canvas-soft/60 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <CompanyAvatar company={c} size="md" />
              <div className="min-w-0">
                <p className="type-body-md font-semibold text-ink">{c.name}</p>
                <p className="truncate type-caption text-ink-mute">{c.description}</p>
              </div>
            </div>
            <ul className={cn("mt-4 grid gap-2", links.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex h-full items-center gap-3 rounded-xl bg-canvas px-4 py-3.5 shadow-level-1 transition-shadow hover:shadow-level-2">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ev-written-soft text-primary-text">
                      <l.Icon className="h-4.5 w-4.5" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block type-body-md font-semibold text-ink group-hover:underline">{l.label}</span>
                      <span className="block type-caption text-ink-mute [word-break:keep-all]">{l.note}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-mute transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
