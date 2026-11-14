import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDown, CalendarClock, ChevronDown, ExternalLink, Lightbulb, PenLine, Play, TriangleAlert } from "lucide-react";
import { mmss, youtubeAt, type WeeklyBlock, type WeeklyEdition, type WeeklySection, type WeeklySource } from "@/lib/weekly";
import { cn } from "../ui";
import { jua } from "./BriefingBrand";

/**
 * 금콩 주간 정리 — 데일리 브리핑과 다르게 보이도록 남색 머리 + 'WEEKLY' 도장 + 영상 칸.
 * 영상과 같은 순서로: 이번 주 한눈에 → 메인(깊게) → 금융 소식 → 시사 → 다음 주 볼 날짜 → 금공 준비생용 → 출처
 */

const NAVY = "#1f2a5c";
const ORANGE = "#f7a14a";

/** **굵게** 를 강조로 */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-bold text-ink">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function VideoAt({ video, at }: { video: string | null; at?: number }) {
  if (!video || at == null) return null;
  return (
    <a
      href={youtubeAt(video, at)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ffe4e4] px-2.5 py-1 type-caption font-bold text-[#b3261e] hover:bg-[#ffd3d3]"
    >
      <Play className="h-3 w-3 fill-current" strokeWidth={0} />
      영상 {mmss(at)}
    </a>
  );
}

function Block({ b }: { b: WeeklyBlock }) {
  switch (b.t) {
    case "p":
      return (
        <p className="type-body-lg leading-[1.85] text-ink-secondary ko-justify">
          <Rich text={b.text} />
        </p>
      );
    case "terms":
      return (
        <dl className="grid gap-3 sm:grid-cols-3">
          {b.items.map((x) => (
            <div key={x.term} className="rounded-2xl bg-[#eef1fd] px-4 py-4">
              <dt className={cn(jua.className, "text-[20px] leading-none")} style={{ color: NAVY }}>
                {x.term}
              </dt>
              <dd className="mt-2 type-body-md leading-relaxed text-ink-secondary [word-break:keep-all]">{x.text}</dd>
            </div>
          ))}
        </dl>
      );
    case "steps":
      return (
        <ol className="space-y-2">
          {b.items.map((x, i) => (
            <li key={i} className="flex gap-3 rounded-xl bg-canvas px-4 py-3 shadow-level-1">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full type-caption font-bold text-on-primary" style={{ background: NAVY }}>
                {i + 1}
              </span>
              <span className="type-body-md leading-relaxed text-ink [word-break:keep-all]">
                <Rich text={x} />
              </span>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div>
          <div className="overflow-x-auto rounded-2xl ring-1 ring-hairline">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <thead>
                <tr style={{ background: NAVY }}>
                  {b.head.map((h) => (
                    <th key={h} className="px-3 py-2.5 type-caption font-bold whitespace-nowrap text-on-primary">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i} className={i % 2 ? "bg-canvas-soft" : "bg-canvas"}>
                    {r.map((c, j) => (
                      <td key={j} className={cn("px-3 py-2.5 align-top type-body-md text-ink-secondary [word-break:keep-all]", j === 0 && "font-semibold whitespace-nowrap text-ink")}>
                        <Rich text={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.note && <p className="mt-2 type-caption text-ink-mute">{b.note}</p>}
        </div>
      );
    case "versus":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {[b.left, b.right].map((side, i) => (
            <div key={side.title} className={cn("rounded-2xl px-4 py-4", i ? "bg-[#e6f4ec]" : "bg-[#fdece3]")}>
              <p className={cn("type-heading-sm", i ? "text-[#2f6b47]" : "text-[#a3471d]")}>{side.title}</p>
              <ul className="mt-2 space-y-2">
                {side.items.map((x, k) => (
                  <li key={k} className="flex gap-2 type-body-md leading-relaxed text-ink-secondary [word-break:keep-all]">
                    <span aria-hidden className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", i ? "bg-[#2f6b47]" : "bg-[#a3471d]")} />
                    <span>
                      <Rich text={x} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "stats":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {b.items.map((x) => (
            <div key={x.label} className="rounded-2xl bg-canvas px-4 py-4 text-center shadow-level-1">
              <p className={cn(jua.className, "text-[28px] leading-none tabular")} style={{ color: NAVY }}>
                {x.value}
              </p>
              <p className="mt-2 type-caption leading-snug text-ink-mute [word-break:keep-all]">{x.label}</p>
            </div>
          ))}
        </div>
      );
    case "facts":
      return (
        <dl className="divide-y divide-hairline rounded-2xl bg-canvas px-4 shadow-level-1">
          {b.items.map((x) => (
            <div key={x.label} className="grid gap-1 py-3.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
              <dt className="type-caption font-bold" style={{ color: NAVY }}>
                {x.label}
              </dt>
              <dd className="type-body-md leading-relaxed text-ink-secondary ko-justify">
                <Rich text={x.text} />
              </dd>
            </div>
          ))}
        </dl>
      );
    case "note": {
      const look = {
        easy: { Icon: Lightbulb, bg: "bg-[#fff7e0]", fg: "text-[#8a5a00]", title: "쉽게 말하면" },
        warn: { Icon: TriangleAlert, bg: "bg-[#fdecec]", fg: "text-[#a32626]", title: "조심해서 읽을 점" },
        key: { Icon: Lightbulb, bg: "bg-[#eef1fd]", fg: "text-[#2b3a7a]", title: "핵심" },
      }[b.tone];
      return (
        <div className={cn("rounded-2xl px-4 py-4", look.bg)}>
          <p className={cn("flex items-center gap-1.5 type-caption font-bold", look.fg)}>
            <look.Icon className="h-4 w-4" strokeWidth={2} />
            {b.title ?? look.title}
          </p>
          <p className="mt-1.5 type-body-md leading-relaxed text-ink ko-justify">
            <Rich text={b.text} />
          </p>
        </div>
      );
    }
  }
}

function Sources({ items }: { items?: WeeklySource[] }) {
  if (!items?.length) return null;
  return (
    <p className="type-caption leading-relaxed text-ink-mute">
      출처:{" "}
      {items.map((s, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-hairline-input underline-offset-2 hover:text-ink">
              {s.name}
            </a>
          ) : (
            s.name
          )}
        </span>
      ))}
    </p>
  );
}

function Section({ s, video, wide = false }: { s: WeeklySection; video: string | null; wide?: boolean }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full px-2.5 py-1 type-caption font-bold text-on-primary" style={{ background: NAVY }}>
          {s.kicker}
        </span>
        <VideoAt video={video} at={s.at} />
      </div>
      <h3 id={`${s.id}-title`} className={cn("mt-3 text-ink [word-break:keep-all]", wide ? "type-heading-lg md:text-[30px] md:leading-[1.3]" : "type-heading-lg")}>
        {s.title}
      </h3>
      {s.art && (
        // eslint-disable-next-line @next/next/no-img-element -- 영상에 쓴 장면 그림
        <img src={s.art} alt={s.artAlt ?? ""} loading="lazy" decoding="async" className="mt-5 aspect-video w-full rounded-2xl object-cover" />
      )}
      <div className="mt-5 space-y-5">
        {s.blocks.map((b, i) => (
          <Block key={i} b={b} />
        ))}
      </div>
      {s.sources && (
        <div className="mt-4">
          <Sources items={s.sources} />
        </div>
      )}
    </section>
  );
}

function GroupHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="border-b-2 pb-3" style={{ borderColor: NAVY }}>
      <p className="type-micro-cap" style={{ color: ORANGE }}>
        {eyebrow}
      </p>
      <h2 className={cn(jua.className, "mt-1 text-[30px] leading-tight md:text-[36px]")} style={{ color: NAVY }}>
        {title}
      </h2>
      {desc && <p className="mt-1 type-body-md text-ink-mute [word-break:keep-all]">{desc}</p>}
    </div>
  );
}

const KIND_TONE: Record<WeeklyEdition["glance"][number]["kind"], string> = {
  메인: "bg-[#f7a14a] text-[#3a2200]",
  금융: "bg-[#dfe6fb] text-[#2b3a7a]",
  시사: "bg-[#e6f4ec] text-[#2f6b47]",
};

export function WeeklyRoundup({ w, title, summary, video }: { w: WeeklyEdition; title: string; summary: string[]; video: string | null }) {
  return (
    <div className="bg-[#f7f6f2]">
      {/* 머리 — 남색 띠 + WEEKLY 도장 (데일리 브리핑의 파스텔 카드와 다르게) */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2b3a7a 70%, #33448f 100%)` }}>
        <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-20" style={{ background: ORANGE }} />
        <div className="relative mx-auto max-w-[1100px] px-4 pt-10 pb-12 md:px-6 md:pt-14 md:pb-16">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(jua.className, "rounded-lg px-2.5 py-1 text-[15px] leading-none tracking-[0.12em]")} style={{ background: ORANGE, color: NAVY }}>
              WEEKLY
            </span>
            <span className="type-caption font-bold text-[#c9d2f5]">금콩 주간 정리 · {w.week}</span>
          </div>
          <h1 className={cn(jua.className, "mt-4 max-w-[860px] text-[30px] leading-[1.25] text-[#ffffff] [word-break:keep-all] md:text-[44px]")}>{title}</h1>
          {summary.length > 0 && (
            <ul className="mt-4 max-w-[760px] space-y-1.5">
              {summary.map((l, i) => (
                <li key={i} className="flex gap-2 type-body-lg leading-relaxed text-[#dfe4f7] [word-break:keep-all]">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ORANGE }} />
                  {l}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 type-caption text-[#aab6e6]">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.75} />
              {w.range}
            </span>
            <span className="inline-flex items-center gap-1">
              <Play className="h-3.5 w-3.5" strokeWidth={1.75} />
              영상 {w.videoLength}
            </span>
            <span>{w.asOf}</span>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1100px] px-4 md:px-6">
        {/* 영상 + 챕터 */}
        <section aria-label="영상으로 보기" className="-mt-6 grid gap-5 rounded-3xl bg-canvas p-4 shadow-level-2 md:-mt-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:p-5">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#11183a]">
            {video ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video}?rel=0`}
                title={title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- 영상 썸네일 */}
                <img src={w.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-[#11183a]/85 px-3 py-1.5 type-caption font-bold text-[#ffffff]">
                  <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                  영상 곧 공개
                </span>
              </>
            )}
          </div>
          <div className="min-w-0">
            <p className="type-micro-cap text-ink-mute">영상 순서 = 글 순서</p>
            <ol className="mt-2 divide-y divide-hairline">
              {w.chapters.map((c) => (
                <li key={c.id + c.at} className="flex items-center gap-2 py-1.5">
                  {video ? (
                    <a href={youtubeAt(video, c.at)} target="_blank" rel="noopener noreferrer" className="w-11 shrink-0 tabular type-caption font-bold text-[#b3261e] hover:underline">
                      {mmss(c.at)}
                    </a>
                  ) : (
                    <span className="w-11 shrink-0 tabular type-caption font-bold text-ink-mute">{mmss(c.at)}</span>
                  )}
                  <a href={`#${c.id}`} className="min-w-0 flex-1 truncate type-body-md text-ink hover:underline">
                    {c.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 이번 주 한눈에 */}
        <section aria-labelledby="glance-title" className="mt-12">
          <h2 id="glance-title" className={cn(jua.className, "text-[28px] leading-tight md:text-[32px]")} style={{ color: NAVY }}>
            이번 주 한눈에
          </h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {w.glance.map((g) => (
              <li key={g.id + g.title}>
                <a href={`#${g.id}`} className="flex h-full gap-3 rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1 transition hover:shadow-level-2">
                  <span className={cn("h-fit shrink-0 rounded-full px-2.5 py-1 type-caption font-bold", KIND_TONE[g.kind])}>{g.kind}</span>
                  <span className="min-w-0">
                    <span className="block type-heading-sm text-ink [word-break:keep-all]">{g.title}</span>
                    <span className="mt-0.5 block type-body-md leading-relaxed text-ink-mute [word-break:keep-all]">{g.line}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-auto max-w-[760px]">
          {/* 메인 — 깊게 */}
          <div className="mt-16">
            <GroupHead eyebrow="이번 주 메인" title={w.question} />
            <div className="mt-5 rounded-2xl px-5 py-5" style={{ background: NAVY }}>
              <p className="type-micro-cap" style={{ color: ORANGE }}>
                한 문장으로 답하면
              </p>
              <p className="mt-1.5 type-body-lg leading-relaxed text-[#ffffff] ko-justify">
                <Rich text={w.answer} />
              </p>
            </div>
            <div className="mt-12 space-y-16">
              {w.main.map((s) => (
                <Section key={s.id} s={s} video={video} wide />
              ))}
            </div>
          </div>

          {/* 금융 소식 */}
          <div className="mt-20">
            <GroupHead eyebrow="금융 소식" title={`이번 주 금융 뉴스 ${w.finance.length}가지`} desc="메인 말고도 금공 준비생이 알아 두면 좋은 금융 뉴스예요." />
            <div className="mt-10 space-y-14">
              {w.finance.map((s) => (
                <Section key={s.id} s={s} video={video} />
              ))}
            </div>
          </div>

          {/* 시사 */}
          <div className="mt-20">
            <GroupHead eyebrow="시사" title={`일반 시사 ${w.current.length}가지`} desc="돈 이야기와 이어지는 시사 뉴스예요." />
            <div className="mt-10 space-y-14">
              {w.current.map((s) => (
                <Section key={s.id} s={s} video={video} />
              ))}
            </div>
          </div>

          {/* 다음 주 볼 날짜 */}
          <section id="next" aria-labelledby="next-title" className="mt-20 scroll-mt-24">
            <GroupHead eyebrow="다음 주" title="앞으로 볼 날짜" />
            <ol className="mt-6 space-y-3">
              {w.next.map((n, i) => (
                <li key={i} className="grid gap-1 rounded-2xl bg-canvas px-4 py-3.5 shadow-level-1 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
                  <p className="type-heading-sm" style={{ color: NAVY }}>
                    {n.when}
                  </p>
                  <div>
                    <p className="type-body-md font-semibold text-ink [word-break:keep-all]">{n.what}</p>
                    <p className="mt-0.5 type-body-md leading-relaxed text-ink-mute [word-break:keep-all]">{n.why}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4">
              <Sources items={w.nextSources} />
            </div>
          </section>

          {/* 금공 준비생용 */}
          <section id="prep" aria-labelledby="prep-title" className="mt-20 scroll-mt-24">
            <GroupHead eyebrow="금공 준비생용" title="논술·면접에서 물을 만한 질문" desc="답할 때 쓸 재료는 모두 위 본문에 있어요." />
            <ol className="mt-6 space-y-4">
              {w.essays.map((e, i) => (
                <li key={i} className="rounded-2xl bg-canvas px-5 py-5 shadow-level-1">
                  <p className="flex gap-2 type-heading-sm text-ink [word-break:keep-all]">
                    <PenLine className="mt-1 h-4 w-4 shrink-0" strokeWidth={2} style={{ color: ORANGE }} />
                    Q{i + 1}. {e.q}
                  </p>
                  <details className="group mt-3">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-full bg-[#eef1fd] px-3 py-1.5 type-caption font-bold text-[#2b3a7a] [&::-webkit-details-marker]:hidden">
                      답할 때 쓸 재료
                      <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" strokeWidth={2} />
                    </summary>
                    <ul className="mt-3 space-y-2">
                      {e.points.map((p, k) => (
                        <li key={k} className="flex gap-2 type-body-md leading-relaxed text-ink-secondary [word-break:keep-all]">
                          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: NAVY }} />
                          <span>
                            <Rich text={p} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ol>

            <h3 className={cn(jua.className, "mt-12 text-[24px]")} style={{ color: NAVY }}>
              이번 주 상식 체크
            </h3>
            <p className="mt-1 type-body-md text-ink-mute">눌러서 답을 확인해 보세요.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {w.quiz.map((x, i) => (
                <li key={i}>
                  <details className="group h-full rounded-2xl bg-canvas px-4 py-4 shadow-level-1">
                    <summary className="cursor-pointer list-none type-body-md font-semibold text-ink [word-break:keep-all] [&::-webkit-details-marker]:hidden">
                      <span className="mr-1.5 tabular" style={{ color: ORANGE }}>
                        {i + 1}.
                      </span>
                      {x.q}
                      <span className="mt-2 flex items-center gap-1 type-caption font-bold text-ink-mute group-open:hidden">
                        <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                        답 보기
                      </span>
                    </summary>
                    <p className={cn(jua.className, "mt-3 text-[22px]")} style={{ color: NAVY }}>
                      {x.a}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </section>

          {/* 주의 */}
          <section aria-label="읽을 때 참고" className="mt-16 rounded-2xl bg-canvas-soft px-5 py-5">
            <ul className="space-y-1.5">
              {w.notes.map((n, i) => (
                <li key={i} className="type-caption leading-relaxed text-ink-mute [word-break:keep-all]">
                  ※ {n}
                </li>
              ))}
            </ul>
            {video && (
              <a href={youtubeAt(video)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 type-caption font-bold text-[#b3261e] hover:underline">
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                유튜브에서 영상 보기
              </a>
            )}
          </section>
        </div>
      </div>
      <div className="h-16" />
    </div>
  );
}

/** 데일리 브리핑 첫 화면의 '이번 주 정리' 띠 */
export function WeeklyBand({ href, title, week, poster, line, chapters, draft = false }: { href: string; title: string; week: string; poster: string; line: string; chapters: string[]; draft?: boolean }): ReactNode {
  return (
    <Link
      href={href}
      className="group grid overflow-hidden rounded-3xl shadow-level-1 transition hover:shadow-level-2 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #2b3a7a 100%)` }}
    >
      <div className="relative aspect-video md:aspect-auto md:min-h-[260px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- 영상 썸네일 */}
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#b3261e] px-3 py-1.5 type-caption font-bold text-[#ffffff]">
          <Play className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
          영상 + 글
        </span>
      </div>
      <div className="flex flex-col px-5 py-5 md:px-7 md:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(jua.className, "rounded-lg px-2 py-0.5 text-[14px] leading-tight tracking-[0.12em]")} style={{ background: ORANGE, color: NAVY }}>
            WEEKLY
          </span>
          <span className="type-caption font-bold text-[#c9d2f5]">금콩 주간 정리 · {week}</span>
          {draft && <span className="rounded-full bg-[#ffffff]/15 px-2 py-0.5 type-caption font-bold text-[#ffd84d]">초안 · 운영자에게만 보여요</span>}
        </div>
        <p className={cn(jua.className, "mt-3 text-[24px] leading-snug text-[#ffffff] [word-break:keep-all] group-hover:underline md:text-[28px]")}>{title}</p>
        <p className="mt-2 type-body-md leading-relaxed text-[#dfe4f7] [word-break:keep-all]">{line}</p>
        {chapters.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {chapters.map((c) => (
              <li key={c} className="rounded-full bg-[#ffffff]/10 px-2.5 py-1 type-caption text-[#dfe4f7]">
                {c}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto pt-5 type-caption font-bold" style={{ color: ORANGE }}>
          영상과 글로 보기 →
        </span>
      </div>
    </Link>
  );
}
