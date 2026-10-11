import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { handleFeedback } from "@/app/admin/actions";
import { formatPostDateTime } from "@/lib/board-meta";
import { getCompany } from "@/lib/data";
import { FEEDBACK_KINDS, type FeedbackItem, type FeedbackKind } from "@/lib/feedback-meta";
import { cn } from "../ui";

const KIND_TONE: Record<FeedbackKind, string> = {
  correction: "bg-ev-doc-soft text-ev-doc",
  posting: "bg-ev-written-soft text-ev-written",
  site: "bg-ev-final-soft text-ev-final",
};

function OpButton({ id, op, label, danger = false }: { id: number; op: string; label: string; danger?: boolean }) {
  return (
    <form action={handleFeedback}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button
        type="submit"
        className={cn(
          "rounded-full border px-3 py-1 type-caption",
          danger ? "border-ruby text-ruby" : op === "done" ? "border-brand-dark bg-brand-dark text-on-primary" : "border-hairline text-ink-secondary",
        )}
      >
        {label}
      </button>
    </form>
  );
}

/** 운영자 화면의 제보·의견 목록 */
export function FeedbackInbox({ items, done = false }: { items: FeedbackItem[]; done?: boolean }) {
  if (!items.length) return <p className="mt-3 type-body-md text-ink-mute">{done ? "처리한 제보가 없어요." : "새 제보가 없어요."}</p>;
  return (
    <ul className="mt-3 divide-y divide-hairline">
      {items.map((f) => {
        const company = f.companyId ? getCompany(f.companyId) : undefined;
        return (
          <li key={f.id} className={cn("py-4", done && "opacity-70")}>
            <div className="flex flex-wrap items-center gap-2 type-caption">
              <span className={cn("tag", KIND_TONE[f.kind])}>{FEEDBACK_KINDS[f.kind].label}</span>
              {f.topic && <span className="tag bg-canvas-soft text-ink-secondary">{f.topic}</span>}
              {company ? (
                <Link href={`/companies/${company.id}`} className="link">
                  {company.name}
                </Link>
              ) : (
                f.companyName && <span className="text-ink">{f.companyName}</span>
              )}
              <span className="tabular text-ink-mute">{formatPostDateTime(f.createdAt)}</span>
              {f.page && (
                <Link href={f.page} className="truncate text-ink-mute hover:underline" title="보낸 화면">
                  {f.page}
                </Link>
              )}
            </div>
            <p className="mt-2 type-body-md whitespace-pre-wrap text-ink [overflow-wrap:anywhere]">{f.body}</p>
            {(f.sourceUrl || f.contact) && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 type-caption">
                {f.sourceUrl && (
                  <a
                    href={f.sourceUrl}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="link inline-flex max-w-full items-center gap-1 break-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    {f.sourceUrl}
                  </a>
                )}
                {f.contact && <span className="text-ink-secondary">답변: {f.contact}</span>}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {done ? (
                <OpButton id={f.id} op="reopen" label="다시 열기" />
              ) : (
                <OpButton id={f.id} op="done" label="처리 완료" />
              )}
              <OpButton id={f.id} op="delete" label="삭제" danger />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
