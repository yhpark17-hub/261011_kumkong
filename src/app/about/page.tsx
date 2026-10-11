import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "서비스 소개·데이터 출처",
  description: "금콩은 금융공기업·공공기관 채용 일정을 달력으로 모아 보여주는 취업 준비 정보 서비스입니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Eyebrow>서비스 소개</Eyebrow>
      <h1 className="mt-3 type-display-md text-ink md:type-display-lg">금콩은 이런 서비스예요</h1>
      <div className="mt-8 space-y-6">
        <Card className="p-6 md:p-8">
          <h2 className="type-heading-md text-ink">채용 일정을 한 달력에</h2>
          <p className="mt-3 type-body-lg text-ink-secondary">
            금융공기업을 준비하다 보면 기관마다 서류 마감, 필기, 면접 일정이 흩어져 있어 놓치기 쉽습니다. 금콩은
            금융공기업·공공기관·공제회·중앙회·시중은행의 채용 일정을 한 달력에 모으고, 필기 과목·전공 유무·블라인드
            여부·경쟁률·자소서 항목을 함께 정리해 지원 전략을 세우는 데 도움을 드립니다.
          </p>
        </Card>
        <Card className="p-6 md:p-8">
          <h2 className="type-heading-md text-ink">데이터 출처와 표기 기준</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 type-body-lg text-ink-secondary">
            <li>채용 일정·자소서 항목·직렬: 각 기관 채용 홈페이지 및 채용 공고문</li>
            <li>경쟁률: 공공기관 경영정보 공개시스템 알리오(ALIO) 신규채용 공시, 기관 발표, 언론 보도</li>
            <li>
              <span className="text-ink">공고 확인</span> 표시는 올해 공고문으로 확인한 일정,{" "}
              <span className="text-ink">예상</span> 표시는 공고 전이라 전년도 일정을 기준으로 추정한 일정입니다.
            </li>
            <li>필기 구성은 최근 공고와 수험생 후기를 바탕으로 정리하며, 해마다 바뀔 수 있습니다.</li>
          </ul>
        </Card>
        <section className="card-cream p-6 md:p-8">
          <h2 className="type-heading-md text-ink">면책 안내</h2>
          <p className="mt-3 type-body-lg text-ink-secondary">
            금콩은 각 기관과 무관한 정보 서비스이며, 게시된 정보는 참고용입니다. 일정 변경이나 오류로 인한 불이익에
            대해 책임지지 않으니 지원 전 반드시 공식 공고를 확인해 주세요. 잘못된 정보는{" "}
            <a className="link" href={`mailto:${SITE.contactEmail}`}>
              {SITE.contactEmail}
            </a>
            로 알려 주시면 빠르게 고치겠습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
