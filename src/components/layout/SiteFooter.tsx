import Link from "next/link";
import { SITE } from "@/lib/site";
import { FeedbackButton } from "../feedback/Feedback";
import { Logo } from "../ui";

const GROUPS = [
  {
    title: "서비스",
    links: [
      { href: "/", label: "채용 캘린더" },
      { href: "/companies", label: "기관 정보·경쟁률" },
      { href: "/guide", label: "필기 가이드" },
    ],
  },
  {
    title: "기관 분류",
    links: [
      { href: "/companies", label: "금융공기업·공공기관" },
      { href: "/companies", label: "공제회·중앙회" },
      { href: "/companies", label: "시중은행·캐피탈" },
    ],
  },
  {
    title: "안내",
    links: [
      { href: "/about", label: "서비스 소개·데이터 출처" },
      { href: "/privacy", label: "개인정보처리방침" },
    ],
  },
];

/** footer-light: canvas, ink-mute, caption, 64px 24px */
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hairline bg-canvas type-caption text-ink-mute">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="type-heading-sm text-ink">금콩</span>
          </div>
          <p className="mt-4 max-w-sm">
            금융공기업·공공기관·공제회·중앙회·시중은행 채용 일정을 한 달력에서 확인하는 취업 준비
            서비스입니다.
          </p>
          <p className="mt-2 max-w-sm">
            일정·경쟁률·자소서 항목은 각 기관 채용 공고와 알리오(ALIO) 공시를 바탕으로 정리하며,
            &lsquo;예상&rsquo;은 전년도 일정 기준 추정값입니다. 지원 전 반드시 공식 공고를 확인하세요.
          </p>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h2 className="type-caption text-ink">{g.title}</h2>
            <ul className="mt-4 space-y-2">
              {g.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
              {g.title === "안내" && (
                <>
                  <li>
                    <FeedbackButton kind="site" className="text-left hover:text-ink">
                      의견·개선 제안 보내기
                    </FeedbackButton>
                  </li>
                  <li>
                    <FeedbackButton kind="posting" className="text-left hover:text-ink">
                      채용 공고 제보
                    </FeedbackButton>
                  </li>
                  <li>
                    <a href={`mailto:${SITE.contactEmail}`} className="hover:text-ink">
                      이메일 문의
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-[1200px] px-6 py-6">
          © 2026 금콩. 본 사이트는 각 기관과 무관한 개인 운영 정보 서비스입니다.
        </p>
      </div>
    </footer>
  );
}
