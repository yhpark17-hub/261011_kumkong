import "server-only";
import type { ArticleFeatureKey } from "@/lib/article-widgets";
import { WrittenExamGuide } from "./WrittenExamGuide";

/**
 * 글 전체를 인터랙티브로 — 본문 맨 위에 {{feature:written-exam}} 한 줄
 * (개념 설명 위주라 통계 숫자는 쓰지 않아요)
 */
export function ArticleFeature({ name, title }: { name: ArticleFeatureKey; title: string }) {
  switch (name) {
    case "feature:written-exam":
      return <WrittenExamGuide title={title} />;
  }
}
