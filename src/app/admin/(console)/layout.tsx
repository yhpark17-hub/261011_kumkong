import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut, PenLine } from "lucide-react";
import { adminLogout } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "운영자 관리", template: "%s · 운영자 | 금콩" },
  robots: { index: false, follow: false },
};

/** 운영자 콘솔 공통 틀 — 로그인 확인은 각 페이지에서 합니다 */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-16 md:px-6 md:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2">
          <span className="tag bg-brand-dark text-on-primary">운영자</span>
          <span className="type-heading-sm text-ink">금콩 관리</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/magazine/new" className="btn btn-sm btn-primary">
            <PenLine className="h-4 w-4" strokeWidth={1.75} />
            블로그 글쓰기
          </Link>
          <Link href="/" className="btn btn-sm btn-toggle">
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            사이트 보기
          </Link>
          <form action={adminLogout}>
            <button type="submit" className="btn btn-sm btn-toggle">
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              로그아웃
            </button>
          </form>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <AdminNav />
        </aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
