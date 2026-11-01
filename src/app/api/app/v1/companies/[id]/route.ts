import { COMPANIES, getCompany, getRecruitment, isAlioListed, sameDayWritten } from "@/lib/data";
import { absUrl, appJson } from "@/lib/server/app-api";

/** 앱: 기관 상세 (필기 구성·경쟁률·자소서 항목·전형 일정) — 정적 데이터라 빌드 때 기관마다 미리 만듦 */
export function generateStaticParams() {
  return COMPANIES.map((c) => ({ id: c.id }));
}

export async function GET(_req: Request, ctx: RouteContext<"/api/app/v1/companies/[id]">) {
  const { id } = await ctx.params;
  const company = getCompany(id);
  const recruitment = getRecruitment(id);
  if (!company || !recruitment) return appJson({ error: "없는 기관이에요" }, { status: 404 });

  const same = sameDayWritten(id);
  return appJson({
    company: { ...company, logo: absUrl(company.logo), wideLogo: absUrl(company.wideLogo) },
    recruitment,
    alioListed: isAlioListed(company),
    sameDayWritten: same && {
      date: same.date,
      companies: same.companies.map((c) => ({ id: c.id, name: c.name, shortName: c.shortName })),
    },
  });
}
