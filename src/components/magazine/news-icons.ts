import { BookA, Building2, ChartLine, Globe, Landmark, MessageCircleQuestion, Scale, type LucideIcon } from "lucide-react";
import type { NewsSection } from "@/lib/news-meta";

/** 브리핑 카테고리 아이콘 — 서버·클라이언트 컴포넌트 함께 사용 */
export const NEWS_ICON: Record<NewsSection, LucideIcon> = {
  finance: Landmark,
  economy: ChartLine,
  policy: Scale,
  global: Globe,
  public: Building2,
  term: BookA,
  question: MessageCircleQuestion,
};
