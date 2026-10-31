import "server-only";
import type { ArticleFeatureKey } from "@/lib/article-widgets";
import { GrowthFundGuide } from "./GrowthFundGuide";
import { KdbCompanyGuide } from "./KdbCompanyGuide";
import { KdbWrittenGuide } from "./KdbWrittenGuide";
import { WrittenExamGuide } from "./WrittenExamGuide";

/**
 * 글 전체를 인터랙티브로 — 본문 맨 위에 {{feature:written-exam}} 같은 한 줄
 * (숫자는 공고에 있는 것만, 후기는 후기라고 표시)
 */
export function ArticleFeature({ name, title }: { name: ArticleFeatureKey; title: string }) {
  switch (name) {
    case "feature:written-exam":
      return <WrittenExamGuide title={title} />;
    case "feature:kdb-written":
      return <KdbWrittenGuide title={title} />;
    case "feature:growth-fund":
      return <GrowthFundGuide title={title} />;
    case "feature:kdb-company":
      return <KdbCompanyGuide title={title} />;
  }
}
