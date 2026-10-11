"use client";

import { catchError, type ErrorInfo } from "next/error";
import { RotateCw } from "lucide-react";

/** DB 를 쓰는 영역에서 오류가 나도 페이지 전체가 깨지지 않게 막는 경계 */
function DbErrorFallback({ silent = false }: { silent?: boolean }, { retry }: ErrorInfo) {
  if (silent) return null;
  return (
    <div className="flex flex-col items-center rounded-lg border border-hairline bg-canvas-soft px-6 py-10 text-center">
      <p className="type-body-lg !font-normal text-ink">이 영역을 잠시 불러오지 못했어요</p>
      <p className="mt-1 type-caption text-ink-mute">달력·기관 정보는 그대로 이용할 수 있어요.</p>
      <button type="button" onClick={() => retry()} className="btn btn-toggle btn-sm mt-4">
        <RotateCw className="h-4 w-4" strokeWidth={1.75} />
        다시 시도
      </button>
    </div>
  );
}

export const DbBoundary = catchError(DbErrorFallback);
