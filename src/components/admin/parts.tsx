import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../ui";

/** 1분 23초 / 45초 / - */
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "-";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}초`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m}분 ${s % 60}초` : `${m}분`;
}

export const nf = new Intl.NumberFormat("ko-KR");

export function AdminPageTitle({ title, desc, aside }: { title: string; desc?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="type-display-md text-ink">{title}</h1>
        {desc && <p className="mt-1 type-body-md text-ink-mute">{desc}</p>}
      </div>
      {aside}
    </div>
  );
}

/** 숫자 하나를 보여 주는 타일 (증감은 직전 같은 기간 대비) */
export function StatTile({
  label,
  value,
  sub,
  delta,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  /** 직전 기간 대비 변화율(%) — null 이면 표시 안 함 */
  delta?: number | null;
  href?: string;
  tone?: "default" | "alert";
}) {
  const body = (
    <>
      <p className="type-caption text-ink-mute">{label}</p>
      <p className={cn("mt-1 tabular type-display-md", tone === "alert" ? "text-ruby" : "text-ink")}>{value}</p>
      <p className="mt-1 flex items-center gap-1.5 type-micro text-ink-mute">
        {delta != null && Number.isFinite(delta) && (
          <span className={cn("inline-flex items-center tabular", delta >= 0 ? "text-ev-final" : "text-ev-doc")}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" strokeWidth={2} /> : <ArrowDownRight className="h-3 w-3" strokeWidth={2} />}
            {Math.abs(Math.round(delta))}%
          </span>
        )}
        {sub}
      </p>
    </>
  );
  const cls = "block rounded-lg border border-hairline bg-canvas p-4 shadow-level-1";
  return href ? (
    <Link href={href} className={cn(cls, "transition-shadow hover:shadow-level-2")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function changePct(now: number, before: number): number | null {
  if (!before) return null;
  return ((now - before) / before) * 100;
}

export function AdminCard({ title, aside, children, className }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card p-5 shadow-level-1 md:p-6", className)}>
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="type-heading-sm text-ink">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_TAG: Record<number, { label: string; cls: string }> = {
  0: { label: "공개", cls: "bg-ev-final-soft text-ev-final" },
  1: { label: "숨김", cls: "bg-canvas-cream text-lemon" },
  2: { label: "삭제됨", cls: "bg-ev-doc-soft text-ev-doc" },
};

export function StatusTag({ status }: { status: number }) {
  const s = STATUS_TAG[status] ?? STATUS_TAG[0];
  return <span className={cn("tag", s.cls)}>{s.label}</span>;
}

/** 목록 위 필터 (GET 폼 — 주소로 공유 가능) */
export function FilterBar({
  action,
  status,
  q,
  placeholder,
  hidden,
  extra,
}: {
  action: string;
  status: string;
  q: string;
  placeholder: string;
  hidden?: Record<string, string | undefined>;
  extra?: ReactNode;
}) {
  const tabs: [string, string][] = [
    ["all", "전체"],
    ["visible", "공개"],
    ["hidden", "숨김"],
    ["deleted", "삭제됨"],
  ];
  const href = (s: string) => {
    const u = new URLSearchParams();
    if (s !== "all") u.set("status", s);
    if (q) u.set("q", q);
    for (const [k, v] of Object.entries(hidden ?? {})) if (v) u.set(k, v);
    const qs = u.toString();
    return qs ? `${action}?${qs}` : action;
  };
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="no-scrollbar fade-x -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0 md:fade-x-none">
        {tabs.map(([key, label]) => (
          <Link key={key} href={href(key)} className={cn("btn btn-sm shrink-0", status === key ? "btn-on-dark" : "btn-toggle")}>
            {label}
          </Link>
        ))}
        {extra}
      </div>
      <form action={action} className="flex gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
        <input name="q" defaultValue={q} placeholder={placeholder} className="input min-w-0 flex-1 md:w-64" aria-label="검색" />
        <button type="submit" className="btn btn-sm btn-toggle shrink-0">
          검색
        </button>
      </form>
    </div>
  );
}

/** 작은 텍스트 버튼 (목록의 한 줄 조치) */
export function RowButton({
  value,
  children,
  danger = false,
  confirm,
}: {
  value: string;
  children: ReactNode;
  danger?: boolean;
  /** 누르기 전에 확인을 받을 문구 */
  confirm?: string;
}) {
  return (
    <button
      type="submit"
      name="target"
      value={value}
      data-confirm={confirm}
      className={cn(
        "rounded-full border px-2.5 py-1 type-micro transition-colors",
        danger ? "border-ruby text-ruby hover:bg-ev-doc-soft" : "border-hairline text-ink-secondary hover:border-hairline-input",
      )}
    >
      {children}
    </button>
  );
}

/** 선택한 항목 일괄 조치 버튼 */
export function BulkButton({ value, children, danger = false, confirm }: { value: string; children: ReactNode; danger?: boolean; confirm?: string }) {
  return (
    <button
      type="submit"
      name="bulk"
      value={value}
      data-confirm={confirm}
      className={cn("btn btn-sm shrink-0", danger ? "border-ruby bg-canvas text-ruby" : "btn-toggle")}
    >
      {children}
    </button>
  );
}

/** 이전·다음 페이지 */
export function AdminPager({ page, total, size, hrefFor }: { page: number; total: number; size: number; hrefFor: (p: number) => string }) {
  const last = Math.max(1, Math.ceil(total / size));
  if (last <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-2 type-caption" aria-label="페이지">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn btn-sm btn-toggle">
          이전
        </Link>
      ) : (
        <span className="btn btn-sm btn-toggle pointer-events-none opacity-40">이전</span>
      )}
      <span className="tabular text-ink-secondary">
        {page} / {last}
      </span>
      {page < last ? (
        <Link href={hrefFor(page + 1)} className="btn btn-sm btn-toggle">
          다음
        </Link>
      ) : (
        <span className="btn btn-sm btn-toggle pointer-events-none opacity-40">다음</span>
      )}
    </nav>
  );
}

/** 목록 주소 만들기 (빈 값은 빼고) */
export function listHref(base: string, params: Record<string, string | number | null | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "" && !(k === "status" && v === "all") && !(k === "page" && v === 1)) u.set(k, String(v));
  const q = u.toString();
  return q ? `${base}?${q}` : base;
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-canvas-soft px-6 py-10 text-center type-body-md text-ink-mute">{children}</p>;
}
