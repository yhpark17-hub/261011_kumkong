"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";

/** 페이지 단위 오류 화면 — 헤더·푸터는 그대로 두고 본문만 바꿉니다 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="type-micro-cap text-primary-text">일시적인 오류</p>
      <h1 className="mt-3 type-display-md text-ink">페이지를 불러오지 못했어요</h1>
      <p className="mt-3 type-body-md text-ink-secondary">잠시 뒤 다시 시도해 주세요. 문제가 계속되면 &lsquo;의견 보내기&rsquo;로 알려 주세요.</p>
      <div className="mt-8 flex gap-2">
        <button type="button" onClick={() => retry()} className="btn btn-primary">
          <RotateCw className="h-4 w-4" strokeWidth={1.75} />
          다시 시도
        </button>
        <Link href="/calendar" className="btn btn-toggle">
          채용 달력으로
        </Link>
      </div>
      {error.digest && <p className="mt-8 type-micro text-ink-mute">오류 코드 {error.digest}</p>}
    </div>
  );
}
