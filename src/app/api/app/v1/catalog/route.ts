import { buildCatalog } from "@/lib/data";
import { absUrl, appJson, contentVersion } from "@/lib/server/app-api";

/**
 * 앱: 전체 기관·일정 (달력·홈·관심 기관용 경량 카탈로그)
 * 일정 데이터는 빌드에 들어간 정적 데이터라 배포 때 미리 만들어 둡니다 — 데이터가 바뀌면 재배포로 갱신.
 */
export function GET() {
  const catalog = buildCatalog();
  const data = {
    companies: catalog.companies.map((c) => ({ ...c, logo: absUrl(c.logo) })),
    recruitments: catalog.recruitments,
  };
  return appJson({ version: contentVersion(data), ...data });
}
