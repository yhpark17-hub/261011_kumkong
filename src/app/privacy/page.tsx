import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "금콩 개인정보처리방침",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "1. 수집하는 개인정보",
    body: "금콩은 회원가입 없이 이용할 수 있으며, 이름·연락처 등 개인을 식별할 수 있는 정보를 직접 수집하지 않습니다. 이메일로 문의하시거나 제보 시 '답변 받을 이메일'을 직접 입력하신 경우에 한해 회신을 위해 이메일 주소를 이용합니다.",
  },
  {
    title: "2. 익명 게시판(콩밭)·필기 후기 이용 시",
    body: "글·댓글·후기를 작성하면 입력한 닉네임, 내용, 작성 시각과 함께 접속 IP를 암호화한 값(복원할 수 없는 해시)과 IP 앞 두 자리가 저장됩니다. IP 앞 두 자리는 도배·사칭 방지를 위해 닉네임 옆에 공개되며, IP 원본은 저장하지 않습니다. 글 비밀번호는 복원할 수 없는 형태(scrypt 해시)로만 저장됩니다. 이 정보는 도배 방지, 신고 처리, 중복 투표 방지 목적으로만 쓰이며, 이용자가 글을 삭제하거나 운영자가 삭제한 뒤에도 분쟁 대응을 위해 최대 1년간 보관 후 파기합니다. 글에 첨부한 사진·파일은 글과 함께 누구나 볼 수 있도록 공개 저장소(Vercel Blob)에 저장되며, 사진은 올리기 전에 브라우저에서 크기를 줄입니다. 첨부 파일에 개인정보가 담기지 않도록 주의해 주세요. 운영자가 글을 완전 삭제하면 첨부 파일도 함께 삭제됩니다.",
  },
  {
    title: "3. 제보·의견 보내기",
    body: "기관 정보 제보, 공고 제보, 사이트 의견을 보내면 입력한 내용과 근거 링크, 보낸 화면 주소, 보낸 시각, 접속 IP의 해시값이 저장되며 운영자만 열람합니다. '답변 받을 이메일'은 선택 항목으로, 답변이 필요할 때만 입력하시면 되고 해당 제보의 처리가 끝나면 즉시 삭제합니다. 제보 내용은 정보 수정과 서비스 개선 목적으로만 쓰이며 최대 1년간 보관 후 파기합니다. 운영자의 검토를 돕기 위해 제보 내용(답변 받을 이메일·IP 해시는 제외)을 AI(Anthropic의 Claude)가 먼저 읽고 사실 확인과 처리 방법을 제안할 수 있으며, 실제 반영 여부는 운영자가 결정합니다.",
  },
  {
    title: "4. 브라우저 저장소와 서비스 쿠키",
    body: "관심기관 목록, 필기 후기의 '응시 여부' 선택, 매거진에서 읽은 글·저장한 글 표시는 이용자의 브라우저(localStorage)에만 저장되며 서버로 전송되지 않습니다. 필기 후기를 남기면 같은 브라우저에서 응답을 고칠 수 있도록 무작위 식별값 쿠키(kk_voter, 1년)를 저장하며, 이 값은 개인을 식별하지 않습니다. 운영자 로그인에는 별도 쿠키(kk_admin)가 쓰입니다. 브라우저 설정에서 사이트 데이터를 삭제하면 함께 삭제됩니다.",
  },
  {
    title: "5. 광고 및 쿠키",
    body: "금콩은 Google AdSense 등 제3자 광고 서비스를 이용할 수 있습니다. Google을 포함한 제3자 공급업체는 쿠키를 사용하여 이용자의 이 사이트 또는 다른 사이트 방문 기록을 바탕으로 광고를 게재합니다. 이용자는 Google 광고 설정(https://adssettings.google.com)에서 맞춤 광고를 해제하거나, www.aboutads.info에서 제3자 공급업체의 쿠키 사용을 거부할 수 있습니다.",
  },
  {
    title: "6. 방문 통계",
    body: "서비스 개선을 위해 자체 방문 통계를 수집합니다. 열람한 페이지 주소, 열람 시각, 화면 크기에 따른 기기 구분(휴대폰·태블릿·PC), 페이지가 화면에 보인 시간, 처음 들어온 외부 사이트의 도메인만 기록하며, 방문자 구분에는 브라우저에 저장한 무작위 ID(localStorage·sessionStorage)를 씁니다. IP 주소나 개인을 알아볼 수 있는 정보는 수집하지 않고, 기록은 400일 뒤 삭제합니다. 브라우저 사이트 데이터를 지우면 방문자 ID도 함께 지워집니다.",
  },
  {
    title: "7. 문의",
    body: `개인정보 관련 문의는 ${SITE.contactEmail}로 보내 주세요.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Eyebrow>안내</Eyebrow>
      <h1 className="mt-3 type-display-md text-ink md:type-display-lg">개인정보처리방침</h1>
      <Card className="mt-8 space-y-6 p-6 md:p-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="type-heading-sm text-ink">{s.title}</h2>
            <p className="mt-2 type-body-md text-ink-secondary">{s.body}</p>
          </section>
        ))}
        <p className="type-caption text-ink-mute">시행일: 2026년 10월 14일 (이전: 2026년 10월 11일)</p>
      </Card>
    </div>
  );
}
