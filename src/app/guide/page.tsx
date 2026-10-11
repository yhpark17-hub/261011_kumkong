import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/ads/AdSlot";
import { formatRatio } from "@/components/company/sections";
import { BlindBadge, Card, Chip, Eyebrow } from "@/components/ui";
import { COMPANIES, latestStat } from "@/lib/data";
import { CATEGORY_META, CATEGORY_ORDER, MAJOR_META } from "@/lib/meta";
import { AD_SLOTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "금융공기업 필기 가이드 — NCS 유형·전공·A매치 정리",
  description:
    "PSAT형·모듈형·피듈형 NCS 차이, 통합전공과 단일전공, A매치, 블라인드 채용, 알리오 경쟁률 보는 법까지 금융공기업 필기 준비에 필요한 개념을 정리했습니다.",
  alternates: { canonical: "/guide" },
};

const NCS_TYPES = [
  {
    name: "PSAT형",
    desc: "긴 지문과 표·그래프를 빠르게 해석하는 유형입니다. 자료해석·상황판단·언어논리 비중이 높아 시간 관리가 핵심이며, 금융공기업에서 자주 쓰입니다.",
    tip: "PSAT 기출(5급·민간경력자)로 실전 감각을 기르고, 문항당 풀이 시간을 정해 두세요.",
  },
  {
    name: "모듈형",
    desc: "NCS 학습모듈의 이론·개념(의사소통 이론, 자원관리 기법, 조직 구조 등)을 묻는 유형입니다. 지문이 짧고 개념을 알면 빠르게 풀 수 있습니다.",
    tip: "NCS 직업기초능력 10개 영역 이론서를 한 번 정리해 두면 여러 기관에 활용됩니다.",
  },
  {
    name: "피듈형",
    desc: "PSAT형과 모듈형을 섞은 유형입니다. 자료해석형 문제와 이론형 문제가 함께 나오며, 대행사에 따라 비중이 달라집니다.",
    tip: "지원 기관의 최근 후기로 영역별 비중을 확인하고 약한 쪽을 집중 보완하세요.",
  },
];

const NCS_AREAS = [
  "의사소통능력",
  "수리능력",
  "문제해결능력",
  "자기개발능력",
  "자원관리능력",
  "대인관계능력",
  "정보능력",
  "기술능력",
  "조직이해능력",
  "직업윤리",
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Eyebrow>필기 가이드</Eyebrow>
      <h1 className="mt-3 type-display-md text-ink md:type-display-lg lg:type-display-xl">금융공기업 필기 가이드</h1>
      <p className="mt-4 max-w-2xl type-body-lg text-ink-secondary">
        처음 금융공기업을 준비한다면 꼭 알아야 할 필기 유형과 용어를 정리했어요.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_304px]">
        <article className="min-w-0 space-y-6">
          <Card className="p-6 md:p-8">
            <h2 className="type-heading-lg text-ink">1. NCS 직업기초능력이란?</h2>
            <p className="mt-4 type-body-lg text-ink-secondary">
              NCS(국가직무능력표준)는 직무 수행에 필요한 능력을 국가가 표준화한 것으로, 대부분의 공공기관
              필기시험에서 &lsquo;직업기초능력&rsquo; 평가에 활용됩니다. 기관마다 아래 10개 영역 중 일부를 골라
              출제합니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {NCS_AREAS.map((a) => (
                <Chip key={a}>{a}</Chip>
              ))}
            </div>
            <p className="mt-4 type-body-lg text-ink-secondary">
              금융공기업은 이 중 <span className="text-ink">의사소통·수리·문제해결</span>을 기본으로 하고,
              정보·자원관리·조직이해를 더하는 경우가 많습니다.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="type-heading-lg text-ink">2. NCS 출제 유형 3가지</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {NCS_TYPES.map((t) => (
                <div key={t.name} className="rounded-md border border-hairline p-4">
                  <h3 className="type-heading-sm text-primary-text">{t.name}</h3>
                  <p className="mt-2 type-body-md text-ink-secondary">{t.desc}</p>
                  <p className="mt-3 rounded-md bg-canvas-cream p-3 type-caption text-ink-secondary">
                    <span className="text-lemon">준비 팁</span> · {t.tip}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <AdSlot slot={AD_SLOTS.inArticle} variant="inarticle" />

          <Card className="p-6 md:p-8">
            <h2 className="type-heading-lg text-ink">3. 전공 시험: 없음 · 통합 · 단일</h2>
            <dl className="mt-6 space-y-3">
              {(["none", "integrated", "single"] as const).map((m) => (
                <div key={m} className="rounded-md bg-canvas-soft p-4">
                  <dt className="type-heading-sm text-ink">{MAJOR_META[m].label}</dt>
                  <dd className="mt-1 type-body-md text-ink-secondary">
                    {MAJOR_META[m].desc}.{" "}
                    {m === "none" && "비전공자도 도전하기 쉽지만 NCS 변별력이 커서 고득점 경쟁이 치열합니다."}
                    {m === "integrated" &&
                      "경영·경제를 함께 공부해야 해 범위가 넓지만, 깊이는 단일전공보다 얕은 편입니다."}
                    {m === "single" &&
                      "경영·경제·법·IT 등 한 과목을 깊게 묻습니다. 서술형·논술형이 많아 답안 작성 연습이 필요합니다."}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="type-heading-lg text-ink">4. A매치란?</h2>
            <p className="mt-4 type-body-lg text-ink-secondary">
              주요 금융공기업들이 <span className="text-ink">같은 날 같은 시간에 필기시험</span>을 치르는 것을
              수험생들은 &lsquo;A매치&rsquo;라고 부릅니다. 하루에 한 곳만 응시할 수 있기 때문에, 서류 단계부터 어느
              기관의 필기에 응시할지 전략적으로 정해야 합니다. 달력에서 필기 날짜가 겹치는 기관을 확인해 보세요.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="type-heading-lg text-ink">5. 블라인드 채용</h2>
            <p className="mt-4 type-body-lg text-ink-secondary">
              2017년부터 공공기관은 입사지원서에 출신지역·가족관계·학력·신체조건·사진 등 직무와 무관한 정보를
              요구하지 않는 블라인드 채용을 시행하고 있습니다. 반면 공공기관이 아닌 공제회·중앙회·시중은행은
              기관마다 기준이 달라 학력이나 자격을 기재하기도 합니다.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="type-heading-lg text-ink">6. 알리오 경쟁률 보는 법</h2>
            <p className="mt-4 type-body-lg text-ink-secondary">
              공공기관 경영정보 공개시스템 알리오(ALIO)에서 기관을 검색한 뒤 경영공시의 &lsquo;신규채용
              현황&rsquo;을 보면 연도별 지원자 수와 채용 인원을 확인할 수 있습니다. 다만 일반·고졸·경력 채용이
              합쳐진 수치인 경우가 많아, 대졸 신입 공채의 실제 경쟁률과는 차이가 있습니다.
            </p>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="type-heading-lg text-ink">7. 기관별 필기 구성 요약</h2>
            <div className="mt-6 overflow-x-auto rounded-xs border border-hairline">
              <table className="w-full min-w-[640px]">
                <thead className="bg-canvas-soft type-caption text-ink-mute">
                  <tr>
                    <th className="px-3 py-2 text-left font-normal">기관</th>
                    <th className="px-3 py-2 text-left font-normal">블라인드</th>
                    <th className="px-3 py-2 text-left font-normal">NCS</th>
                    <th className="px-3 py-2 text-left font-normal">전공</th>
                    <th className="px-3 py-2 text-right font-normal">경쟁률</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORY_ORDER.flatMap((cat) =>
                    COMPANIES.filter((c) => c.category === cat).map((c) => {
                      const s = latestStat(c);
                      return (
                        <tr key={c.id} className="border-t border-hairline">
                          <td className="px-3 py-3">
                            <Link href={`/companies/${c.id}`} className="type-body-md text-ink hover:text-primary-text">
                              {c.name}
                            </Link>
                            <span className="ml-2 type-micro text-ink-mute">{CATEGORY_META[c.category].label}</span>
                          </td>
                          <td className="px-3 py-3">
                            <BlindBadge blind={c.blind} />
                          </td>
                          <td className="px-3 py-3 type-caption text-ink-secondary">
                            {c.written.ncs.has === false
                              ? "없음"
                              : c.written.ncs.has
                                ? [c.written.ncs.type, c.written.ncs.minutes && `${c.written.ncs.minutes}분`]
                                    .filter(Boolean)
                                    .join(" · ") || "있음"
                                : "확인 중"}
                          </td>
                          <td className="px-3 py-3 type-caption text-ink-secondary">
                            {MAJOR_META[c.written.major.type].label}
                          </td>
                          <td className="px-3 py-3 text-right type-body-tabular text-ink">
                            {s?.ratio != null ? formatRatio(s.ratio) : "-"}
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </article>

        <aside className="space-y-4">
          <AdSlot slot={AD_SLOTS.sidebar} variant="rectangle" />
          <div className="lg:sticky lg:top-24">
            <AdSlot slot={AD_SLOTS.sidebarSticky} variant="skyscraper" className="hidden lg:block" />
          </div>
        </aside>
      </div>
    </div>
  );
}
