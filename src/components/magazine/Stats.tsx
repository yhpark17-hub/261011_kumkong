import { Eye, Heart } from "lucide-react";
import { cn } from "../ui";

const nf = new Intl.NumberFormat("ko-KR");

/** 조회 · 추천 수 — 블로그 글·데일리 브리핑 목록과 카드에 (읽는 시간 대신) */
export function ViewsLikes({ views, likes, className }: { views: number; likes: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 tabular", className)}>
      <span className="inline-flex items-center gap-1" title="조회수">
        <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="sr-only">조회</span>
        {nf.format(views)}
      </span>
      <span className="inline-flex items-center gap-1" title="추천">
        <Heart className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="sr-only">추천</span>
        {nf.format(likes)}
      </span>
    </span>
  );
}
