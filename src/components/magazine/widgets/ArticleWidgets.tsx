"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, BarChart3, BookOpen, ChevronDown, ExternalLink, MousePointerClick, Search, Shuffle } from "lucide-react";
import { cn } from "../../ui";

/* ------------------------------------------------------------------ */
/* 공통                                                                  */
/* ------------------------------------------------------------------ */

export interface WCompany {
  id: string;
  short: string;
  name: string;
  cat: string;
}

export interface WCategory {
  key: string;
  label: string;
}

const FOOT = "금콩 기관 정보 기준 — 정확한 시험 구성·일정은 각 기관 채용 공고를 꼭 확인하세요.";

function Frame({ title, hint, children, foot = FOOT }: { title: string; hint: string; children: ReactNode; foot?: string | null }) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-hairline bg-canvas first:mt-0">
      <header className="flex flex-col gap-1.5 border-b border-hairline bg-canvas-soft px-4 py-3.5 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
        <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-on-primary">
          <MousePointerClick className="h-3 w-3" strokeWidth={2.2} />
          눌러 보기
        </span>
        <span className="min-w-0">
          <span className="block type-heading-sm text-ink [word-break:keep-all]">{title}</span>
          <span className="block type-caption text-ink-mute [word-break:keep-all]">{hint}</span>
        </span>
      </header>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      {foot && <p className="border-t border-hairline px-4 py-2.5 type-caption text-ink-mute [word-break:keep-all] sm:px-5">{foot}</p>}
    </section>
  );
}

const chip = "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 type-caption whitespace-nowrap transition-colors";
const chipOn = (on: boolean) => (on ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary hover:border-hairline-input");

/** 기관 분류 칩 줄 (전체 + 분류) */
function CategoryChips({ cats, value, onChange }: { cats: WCategory[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {[{ key: "all", label: "전체" }, ...cats].map((c) => (
        <button key={c.key} type="button" onClick={() => onChange(c.key)} aria-pressed={value === c.key} className={cn(chip, chipOn(value === c.key))}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

function CompanyChip({ c, dashed = false, note }: { c: WCompany; dashed?: boolean; note?: string }) {
  return (
    <Link
      href={`/companies/${c.id}`}
      title={c.name}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-canvas px-2.5 py-1 type-caption text-ink hover:border-brand-dark",
        dashed ? "border-dashed border-hairline-input" : "border-hairline",
      )}
    >
      {c.short}
      {note && <span className="text-ink-mute">{note}</span>}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* NCS 10개 영역                                                         */
/* ------------------------------------------------------------------ */

export interface NcsArea {
  key: string;
  label: string;
  desc: string;
  /** NCS 10개 영역 밖 (예: 일부 기관의 '디지털') */
  extra?: boolean;
}

export function NcsAreasWidget({
  title,
  hint,
  areas,
  companies,
  cats,
}: {
  title: string;
  hint: string;
  areas: NcsArea[];
  companies: (WCompany & { areas: string[] })[];
  cats: WCategory[];
}) {
  const [cat, setCat] = useState("finance");
  const [sel, setSel] = useState(areas[0]?.key ?? "");
  const list = useMemo(() => companies.filter((c) => cat === "all" || c.cat === cat), [companies, cat]);
  const count = (k: string) => list.filter((c) => c.areas.includes(k)).length;
  const max = Math.max(1, ...areas.map((a) => count(a.key)));
  const area = areas.find((a) => a.key === sel) ?? areas[0];
  const picked = list.filter((c) => c.areas.includes(area.key));

  return (
    <Frame title={title} hint={hint}>
      <CategoryChips cats={cats} value={cat} onChange={setCat} />
      <p className="mt-3 type-caption text-ink-mute">
        NCS 영역이 확인된 기관 <strong className="font-semibold text-ink">{list.length}곳</strong> 기준 · 막대가 길수록 많이 내는 영역
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {areas.map((a) => {
          const n = count(a.key);
          const on = a.key === area.key;
          return (
            <li key={a.key}>
              <button
                type="button"
                onClick={() => setSel(a.key)}
                aria-pressed={on}
                className={cn(
                  "flex h-full w-full flex-col rounded-xl border px-3 py-2.5 text-left transition-colors",
                  on ? "border-primary bg-ev-written-soft" : "border-hairline hover:border-hairline-input",
                  a.extra && !on && "border-dashed",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn("type-body-md font-semibold [word-break:keep-all]", on ? "text-primary-text" : "text-ink")}>{a.label}</span>
                  <span className="shrink-0 tabular type-caption text-ink-mute">{n}곳</span>
                </span>
                <span aria-hidden className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas-soft">
                  <span className={cn("block h-full rounded-full", a.extra ? "bg-ink-mute-2" : "bg-primary")} style={{ width: `${(n / max) * 100}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-xl bg-canvas-soft px-4 py-3.5" aria-live="polite">
        <p className="type-body-md font-semibold text-ink">
          {area.label}
          {area.extra && <span className="ml-1.5 rounded-full bg-canvas px-2 py-0.5 align-middle type-caption font-normal text-ink-mute">10개 영역 밖</span>}
        </p>
        <p className="mt-1 type-caption leading-relaxed text-ink-secondary [word-break:keep-all]">{area.desc}</p>
        <p className="mt-3 type-caption text-ink-mute">이 영역을 내는 기관 {picked.length}곳</p>
        {picked.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {picked.map((c) => (
              <CompanyChip key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <p className="mt-1 type-caption text-ink-mute">이 분류에는 이 영역을 내는 기관이 확인되지 않았어요.</p>
        )}
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* NCS 출제 유형 3가지                                                    */
/* ------------------------------------------------------------------ */

const TYPES = [
  {
    key: "psat",
    label: "PSAT형",
    Icon: BarChart3,
    desc: "긴 지문과 표·그래프를 빠르게 해석하는 유형이에요. 자료해석·상황판단·언어논리 비중이 높아 시간 관리가 핵심이고, 금융공기업에서 자주 쓰여요.",
    tip: "PSAT 기출(5급·민간경력자)로 실전 감각을 기르고, 문항당 풀이 시간을 정해 두세요.",
  },
  {
    key: "module",
    label: "모듈형",
    Icon: BookOpen,
    desc: "NCS 학습모듈의 이론·개념(의사소통 이론, 자원관리 기법, 조직 구조 등)을 묻는 유형이에요. 지문이 짧고 개념을 알면 빠르게 풀 수 있어요.",
    tip: "NCS 직업기초능력 10개 영역 이론서를 한 번 정리해 두면 여러 기관에 활용돼요.",
  },
  {
    key: "mixed",
    label: "피듈형",
    Icon: Shuffle,
    desc: "PSAT형과 모듈형을 섞은 유형이에요. 자료해석형 문제와 이론형 문제가 함께 나오고, 대행사에 따라 비중이 달라요.",
    tip: "지원 기관의 최근 필기 후기로 영역별 비중을 확인하고, 약한 쪽을 집중해서 보완하세요.",
  },
] as const;

const TYPE_ROWS: { label: string; cells: [string, string, string] }[] = [
  { label: "지문", cells: ["길고 표·그래프가 많아요", "짧아요", "길고 짧은 문제가 섞여요"] },
  { label: "핵심", cells: ["자료 해석 + 시간 관리", "이론·개념", "둘 다 + 비중 파악"] },
  { label: "먼저 볼 자료", cells: ["PSAT 기출", "NCS 이론서", "지원 기관 필기 후기"] },
];

export function NcsTypesWidget({ title, hint }: { title: string; hint: string }) {
  const [sel, setSel] = useState(0);
  const t = TYPES[sel];
  return (
    <Frame title={title} hint={hint} foot={null}>
      <div role="tablist" aria-label="NCS 출제 유형" className="grid grid-cols-3 gap-1.5 rounded-xl bg-canvas-soft p-1">
        {TYPES.map((x, i) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={i === sel}
            onClick={() => setSel(i)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 type-body-md font-semibold transition-colors",
              i === sel ? "bg-canvas text-primary-text shadow-level-1" : "text-ink-secondary hover:text-ink",
            )}
          >
            <x.Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {x.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-4">
        <p className="type-body-md leading-relaxed text-ink ko-justify">{t.desc}</p>
        <p className="mt-3 rounded-xl border border-ev-final/30 bg-ev-final-soft px-4 py-3 type-caption leading-relaxed text-ink [word-break:keep-all]">
          <span className="font-semibold text-ev-final">준비 팁 · </span>
          {t.tip}
          {t.key === "mixed" && (
            <Link href="/reviews" className="link ml-1 inline-flex items-center gap-0.5">
              필기 후기 보기 <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          )}
        </p>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-hairline">
        <table className="w-full min-w-[460px] border-collapse">
          <thead className="bg-canvas-soft">
            <tr>
              <th className="px-3 py-2 text-left type-caption font-semibold text-ink-secondary">한눈에 비교</th>
              {TYPES.map((x, i) => (
                <th key={x.key} className={cn("px-3 py-2 text-left type-caption font-semibold", i === sel ? "bg-ev-written-soft text-primary-text" : "text-ink-secondary")}>
                  <button type="button" onClick={() => setSel(i)} className="hover:underline">
                    {x.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPE_ROWS.map((r) => (
              <tr key={r.label} className="border-t border-hairline">
                <td className="px-3 py-2.5 type-caption font-semibold whitespace-nowrap text-ink">{r.label}</td>
                {r.cells.map((cell, i) => (
                  <td key={i} className={cn("px-3 py-2.5 type-caption [word-break:keep-all]", i === sel ? "bg-ev-written-soft/60 font-semibold text-ink" : "text-ink-secondary")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 내 전공으로 볼 수 있는 기관                                             */
/* ------------------------------------------------------------------ */

export interface MajorCompany extends WCompany {
  majorType: "none" | "integrated" | "single";
  subjects: string;
}

const MAJORS = [
  { key: "경영", subject: "경영이", re: /경영|회계/ },
  { key: "경제", subject: "경제가", re: /경제/ },
  // '법인세법'·'국민연금법' 같은 법령 이름은 빼고, 법학 과목이나 '법' 계열만
  { key: "법", subject: "법이", re: /법학|민법|상법|헌법|행정법|민사소송법|법정|(^|[·\s/(,])법(?=[·\s/(),]|$| 중)/ },
  { key: "IT·전산", subject: "IT·전산이", re: /IT|전산|컴퓨터|정보보호|정보보안|소프트웨어|프로그래밍|데이터베이스|빅데이터|인공지능|AI|코딩/ },
  { key: "통계", subject: "통계가", re: /통계/ },
  { key: "전공 시험 없음", subject: "", re: null },
] as const;

/** 처음에 보여 줄 기관 수 (나머지는 '더 보기') */
const MAJOR_FIRST = 8;

const MAJOR_TYPE_LABEL = { none: "전공 없음", integrated: "통합 전공", single: "단일 전공" } as const;

export function MajorFinderWidget({ title, hint, companies, cats }: { title: string; hint: string; companies: MajorCompany[]; cats: WCategory[] }) {
  const [major, setMajor] = useState<string>("경영");
  const [cat, setCat] = useState("finance");
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const m = MAJORS.find((x) => x.key === major)!;
  const found = companies.filter(
    (c) => (cat === "all" || c.cat === cat) && (m.re ? c.majorType !== "none" && m.re.test(c.subjects) : c.majorType === "none"),
  );
  return (
    <Frame title={title} hint={hint}>
      <p className="type-caption font-semibold text-ink-secondary">① 내 전공</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MAJORS.map((x) => (
          <button key={x.key} type="button" onClick={() => setMajor(x.key)} aria-pressed={major === x.key} className={cn(chip, chipOn(major === x.key))}>
            {x.key}
          </button>
        ))}
      </div>
      <p className="mt-4 type-caption font-semibold text-ink-secondary">② 기관 분류</p>
      <div className="mt-2">
        <CategoryChips cats={cats} value={cat} onChange={setCat} />
      </div>
      <p className="mt-4 flex items-center gap-1.5 type-body-md text-ink" aria-live="polite">
        <Search className="h-4 w-4 text-ink-mute" strokeWidth={1.75} />
        {m.re ? (
          <>
            필기 과목에 <strong className="font-semibold">{m.subject}</strong> 있는 곳 <strong className="tabular font-semibold text-primary-text">{found.length}곳</strong>
          </>
        ) : (
          <>
            전공 시험 없이 NCS 등으로만 보는 곳 <strong className="tabular font-semibold text-primary-text">{found.length}곳</strong>
          </>
        )}
      </p>
      {found.length ? (
        <ul className="mt-3 divide-y divide-hairline rounded-xl border border-hairline">
          {(all ? found : found.slice(0, MAJOR_FIRST)).map((c) => {
            const isOpen = open === c.id;
            return (
              <li key={c.id}>
                <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-canvas-soft">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate type-body-md font-semibold text-ink">{c.name}</span>
                    {!isOpen && c.subjects && <span className="block truncate type-caption text-ink-mute">{c.subjects}</span>}
                  </span>
                  <span className="shrink-0 rounded-full bg-canvas-soft px-2 py-0.5 type-caption text-ink-secondary">{MAJOR_TYPE_LABEL[c.majorType]}</span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-mute transition-transform", isOpen && "rotate-180")} strokeWidth={2} />
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5">
                    {c.subjects && <p className="rounded-lg bg-canvas-soft px-3 py-2.5 type-caption leading-relaxed text-ink-secondary [word-break:keep-all]">{c.subjects}</p>}
                    <Link href={`/companies/${c.id}`} className="link mt-2 inline-flex items-center gap-1 type-caption">
                      필기 구성·경쟁률 자세히 <ArrowRight className="h-3 w-3" strokeWidth={2} />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl bg-canvas-soft px-4 py-3 type-caption text-ink-mute">이 분류에서는 해당하는 기관이 확인되지 않았어요. 분류를 &lsquo;전체&rsquo;로 바꿔 보세요.</p>
      )}
      {found.length > MAJOR_FIRST && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 inline-flex items-center gap-1 type-caption text-primary-text hover:underline">
          {all ? "접기" : `${found.length - MAJOR_FIRST}곳 더 보기`}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", all && "rotate-180")} strokeWidth={2} />
        </button>
      )}
      <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">과목 설명에 그 과목 이름이 들어간 기관을 모았어요. 직렬마다 다를 수 있으니 눌러서 과목 설명을 꼭 확인하세요.</p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* A매치 — 필기 날짜가 겹치는 날                                            */
/* ------------------------------------------------------------------ */

export interface AMatchDay {
  date: string;
  items: (WCompany & { expected: boolean })[];
}

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabel = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return `${m}월 ${dd}일 (${WEEK[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]})`;
};
const todayKey = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

export function AMatchWidget({ title, hint, days, financeCats }: { title: string; hint: string; days: AMatchDay[]; financeCats: string[] }) {
  const [onlyFinance, setOnlyFinance] = useState(true);
  const [more, setMore] = useState(false);
  const today = todayKey();
  const list = days
    .filter((d) => d.date >= today)
    .map((d) => ({ ...d, items: onlyFinance ? d.items.filter((c) => financeCats.includes(c.cat)) : d.items }))
    .filter((d) => d.items.length >= 2);
  const shown = more ? list : list.slice(0, 4);
  return (
    <Frame title={title} hint={hint}>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setOnlyFinance(true)} aria-pressed={onlyFinance} className={cn(chip, chipOn(onlyFinance))}>
          금융공기업·금융유관만
        </button>
        <button type="button" onClick={() => setOnlyFinance(false)} aria-pressed={!onlyFinance} className={cn(chip, chipOn(!onlyFinance))}>
          모든 기관
        </button>
      </div>
      {shown.length ? (
        <ol className="mt-4 space-y-3">
          {shown.map((d) => (
            <li key={d.date} className="rounded-xl border border-hairline px-4 py-3">
              <p className="flex items-center gap-2">
                <span className="type-body-md font-semibold text-ink">{dayLabel(d.date)}</span>
                <span className="rounded-full bg-ev-doc-soft px-2 py-0.5 tabular type-caption font-semibold text-ev-doc">{d.items.length}곳 같은 날</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {d.items.map((c) => (
                  <CompanyChip key={c.id} c={c} dashed={c.expected} note={c.expected ? "예상" : undefined} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl bg-canvas-soft px-4 py-3 type-caption text-ink-mute">다가오는 일정 중에는 날짜가 겹치는 필기가 없어요.</p>
      )}
      {list.length > 4 && (
        <button type="button" onClick={() => setMore((v) => !v)} className="mt-3 inline-flex items-center gap-1 type-caption text-primary-text hover:underline">
          {more ? "접기" : `${list.length - 4}일 더 보기`}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", more && "rotate-180")} strokeWidth={2} />
        </button>
      )}
      <p className="mt-3 type-caption text-ink-mute [word-break:keep-all]">
        점선은 공고 전이라 작년 일정으로 추정한 &lsquo;예상&rsquo; 날짜예요. 기관 이름을 누르면 일정·필기 구성을 볼 수 있어요.{" "}
        <Link href="/" className="link">
          채용 캘린더에서 보기
        </Link>
      </p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 기관 분류별 블라인드 채용                                               */
/* ------------------------------------------------------------------ */

export interface BlindRow {
  key: string;
  label: string;
  groups: { full: WCompany[]; partial: WCompany[]; none: WCompany[]; unknown: WCompany[] };
}

const BLIND = [
  { key: "full", label: "블라인드", bar: "bg-primary" },
  { key: "partial", label: "부분 블라인드", bar: "bg-[#8fa0ff]" },
  { key: "none", label: "블라인드 아님", bar: "bg-ev-doc" },
  { key: "unknown", label: "확인 중", bar: "bg-hairline-input" },
] as const;

export function BlindCompareWidget({ title, hint, rows }: { title: string; hint: string; rows: BlindRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Frame title={title} hint={hint}>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="범례">
        {BLIND.map((b) => (
          <li key={b.key} className="inline-flex items-center gap-1.5 type-caption text-ink-secondary">
            <span aria-hidden className={cn("h-2.5 w-2.5 rounded-sm", b.bar)} />
            {b.label}
          </li>
        ))}
      </ul>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => {
          const total = BLIND.reduce((s, b) => s + r.groups[b.key].length, 0);
          if (!total) return null;
          const isOpen = open === r.key;
          return (
            <li key={r.key} className="rounded-xl border border-hairline">
              <button type="button" onClick={() => setOpen(isOpen ? null : r.key)} aria-expanded={isOpen} className="w-full px-3.5 py-3 text-left hover:bg-canvas-soft">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="type-body-md font-semibold text-ink">{r.label}</span>
                  <span className="tabular type-caption text-ink-mute">
                    블라인드 {r.groups.full.length + r.groups.partial.length} / {total}곳
                  </span>
                </span>
                <span aria-hidden className="mt-2 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
                  {BLIND.map((b) =>
                    r.groups[b.key].length ? <span key={b.key} className={cn("h-full first:rounded-l-full last:rounded-r-full", b.bar)} style={{ width: `${(r.groups[b.key].length / total) * 100}%` }} /> : null,
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="space-y-2.5 px-3.5 pb-3.5">
                  {BLIND.map((b) =>
                    r.groups[b.key].length ? (
                      <div key={b.key}>
                        <p className="flex items-center gap-1.5 type-caption font-semibold text-ink-secondary">
                          <span aria-hidden className={cn("h-2 w-2 rounded-sm", b.bar)} />
                          {b.label} {r.groups[b.key].length}곳
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {r.groups[b.key].map((c) => (
                            <CompanyChip key={c.id} c={c} />
                          ))}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 type-caption text-ink-mute">분류를 누르면 기관 이름이 보여요.</p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 알리오 경쟁률 보는 법                                                   */
/* ------------------------------------------------------------------ */

const ALIO_STEPS = [
  { title: "알리오 접속", text: "공공기관 경영정보 공개시스템 알리오(ALIO)에 들어가요.", focus: "url" },
  { title: "기관 검색", text: "기관명을 검색해서 기관 페이지로 들어가요.", focus: "search" },
  { title: "경영공시 → 신규채용 현황", text: "경영공시의 '신규채용 현황'에서 연도별 지원자 수와 채용 인원을 확인해요.", focus: "menu" },
  { title: "숫자 읽을 때 주의", text: "일반·고졸·경력 채용이 합쳐진 수치인 경우가 많아, 대졸 신입 공채의 실제 경쟁률과는 차이가 있어요.", focus: "table" },
] as const;

export function AlioStepsWidget({ title, hint }: { title: string; hint: string }) {
  const [step, setStep] = useState(0);
  const s = ALIO_STEPS[step];
  const hi = (k: string) => (s.focus === k ? "ring-2 ring-primary ring-offset-2 ring-offset-canvas-soft" : "opacity-50");
  return (
    <Frame title={title} hint={hint} foot={null}>
      <ol className="grid grid-cols-4 gap-1.5">
        {ALIO_STEPS.map((x, i) => (
          <li key={x.title}>
            <button
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn("flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition-colors", i === step ? "bg-ev-written-soft" : "hover:bg-canvas-soft")}
            >
              <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full tabular type-caption font-bold", i <= step ? "bg-primary text-on-primary" : "bg-canvas-soft text-ink-mute")}>
                {i + 1}
              </span>
              <span className={cn("type-caption leading-tight [word-break:keep-all]", i === step ? "font-semibold text-ink" : "text-ink-mute")}>{x.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* 화면 그림 — 지금 단계에서 볼 곳을 강조 */}
      <div aria-hidden className="mt-4 rounded-xl border border-hairline bg-canvas-soft p-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff7a8a]" />
          <span className="h-2 w-2 rounded-full bg-[#ffcf4d]" />
          <span className="h-2 w-2 rounded-full bg-[#56c08a]" />
          <span className={cn("ml-2 flex-1 rounded-md bg-canvas px-2 py-1 type-caption text-ink-secondary", hi("url"))}>www.alio.go.kr</span>
        </div>
        <div className={cn("mt-3 flex items-center gap-2 rounded-md bg-canvas px-2.5 py-1.5", hi("search"))}>
          <Search className="h-3.5 w-3.5 text-ink-mute" strokeWidth={2} />
          <span className="type-caption text-ink-mute">기관명 검색</span>
        </div>
        <div className={cn("mt-3 flex flex-wrap gap-1.5", hi("menu"))}>
          {["기관정보", "경영공시", "신규채용 현황"].map((m, i) => (
            <span key={m} className={cn("rounded-md px-2 py-1 type-caption", i === 2 ? "bg-primary text-on-primary" : "bg-canvas text-ink-secondary")}>
              {m}
            </span>
          ))}
        </div>
        <div className={cn("mt-3 overflow-hidden rounded-md bg-canvas", hi("table"))}>
          <div className="grid grid-cols-4 gap-px bg-hairline type-caption">
            {["연도", "지원자", "채용", "구분"].map((h) => (
              <span key={h} className="bg-canvas-soft px-2 py-1 font-semibold text-ink-secondary">
                {h}
              </span>
            ))}
            {["○○○○", "○○○명", "○○명", "일반+고졸+경력"].map((v, i) => (
              <span key={i} className={cn("bg-canvas px-2 py-1 text-ink-mute", i === 3 && "font-semibold text-ev-doc")}>
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4" aria-live="polite">
        <p className="type-body-md font-semibold text-ink">
          {step + 1}. {s.title}
        </p>
        <p className="mt-1 type-body-md leading-relaxed text-ink-secondary ko-justify">{s.text}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {step < ALIO_STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="btn btn-sm btn-primary">
              다음 단계 <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <Link href="/companies" className="btn btn-sm btn-primary">
              금콩에서 기관별 경쟁률 비교 <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          )}
          {step === 0 && (
            <a href="https://www.alio.go.kr" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
              알리오 열기 <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            </a>
          )}
        </div>
      </div>
    </Frame>
  );
}
