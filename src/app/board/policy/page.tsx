import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";
import { BOARD_NAME } from "@/lib/board-meta";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `${BOARD_NAME} 운영정책`,
  description: `${SITE.name} 익명 게시판 ${BOARD_NAME}과 필기 후기의 이용 수칙, 금지 행위, 신고·임시조치 기준입니다.`,
  alternates: { canonical: "/board/policy" },
};

const RULES: { title: string; items: string[] }[] = [
  {
    title: "1. 시험 문제 원문 공유 금지",
    items: [
      "필기시험 문제의 원문, 복원 문항, 선택지를 옮겨 적는 것은 저작권과 시험 보안 문제로 금지돼요.",
      "대신 출제 경향(예: '자료해석 비중이 높았다'), 체감 난이도, 시간 배분 같은 후기는 얼마든지 환영해요.",
    ],
  },
  {
    title: "2. 비방·차별·개인정보 노출 금지",
    items: [
      "특정인이나 기관 임직원을 비방하거나 실명·연락처 등 개인정보를 올리면 삭제돼요.",
      "욕설과 혐오 표현은 자동으로 걸러지고, 반복되면 글쓰기가 제한될 수 있어요.",
    ],
  },
  {
    title: "3. 광고·도배 금지",
    items: [
      "스터디 모집 외의 상업 광고, 같은 내용 반복 게시는 삭제돼요.",
      "링크는 글 하나에 2개까지 넣을 수 있고, 글은 30초·댓글은 10초에 한 번 쓸 수 있어요.",
    ],
  },
  {
    title: "4. 신고와 임시조치",
    items: [
      "누구나 글·댓글·후기를 신고할 수 있어요. 신고가 5건 쌓이면 자동으로 임시 숨김되고 운영자가 검토해요.",
      "권리 침해(명예훼손·저작권 등)를 주장하는 요청은 이메일로 받아 정보통신망법에 따라 임시조치할 수 있어요.",
    ],
  },
  {
    title: "5. 익명이지만 기록은 남아요",
    items: [
      "작성 시 IP는 원본이 아닌 암호화된 값(해시)과 앞 두 자리만 저장되고, 앞 두 자리는 닉네임 옆에 표시돼요.",
      "수사기관의 적법한 요청이 있으면 보관 중인 정보를 제공할 수 있어요.",
    ],
  },
  {
    title: "6. 운영자 표시",
    items: [
      `운영자가 쓴 글·댓글에는 '운영자' 배지가 붙어요. '운영자', '관리자', '${SITE.name}'이 들어간 닉네임은 쓸 수 없어요.`,
      "비밀번호를 잊은 글은 이메일로 요청하면 확인 후 대신 삭제해 드려요.",
    ],
  },
];

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-[840px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Link href="/board" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        {BOARD_NAME} 목록
      </Link>
      <Eyebrow className="mt-6">운영정책</Eyebrow>
      <h1 className="mt-3 type-display-md text-ink md:type-display-lg">{BOARD_NAME} 이용 수칙</h1>
      <p className="mt-4 type-body-lg text-ink-secondary">
        모두가 편하게 정보를 나눌 수 있도록 아래 수칙을 지켜 주세요. {BOARD_NAME}과 필기 후기에 똑같이 적용돼요.
      </p>
      <div className="mt-10 space-y-4">
        {RULES.map((r) => (
          <Card key={r.title} className="p-6 md:p-8">
            <h2 className="type-heading-sm text-ink">{r.title}</h2>
            <ul className="mt-3 space-y-2 type-body-md text-ink-secondary">
              {r.items.map((it) => (
                <li key={it}>· {it}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="mt-8 type-caption text-ink-mute">
        신고·삭제 요청:{" "}
        <a className="link" href={`mailto:${SITE.contactEmail}`}>
          {SITE.contactEmail}
        </a>
      </p>
    </div>
  );
}
