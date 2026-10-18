import { connection } from "next/server";
import { ExamTalk } from "@/components/reviews/ExamTalk";
import { diffDays, todayKST } from "@/lib/date";
import { examsForCompany } from "@/lib/server/reviews";
import { isAdmin, voterToken } from "@/lib/server/security";
import { listTalk } from "@/lib/server/talk";

/** 기관 정보: 실시간 톡방 — 필기 후기 페이지의 응시자 톡과 같은 방 (요청 시 렌더링) */
export async function CompanyTalk({ companyId, companyName }: { companyId: string; companyName: string }) {
  await connection();
  const today = todayKST();
  const [voter, admin] = await Promise.all([voterToken(false), isAdmin()]);
  const initial = await listTalk(companyId, { voter, admin });
  // 이 기관 필기 당일 ~ 이틀 뒤면 LIVE (자주 새로고침)
  const live = examsForCompany(companyId).some((e) => !e.expected && e.date <= today && diffDays(e.date, today) <= 2);
  return <ExamTalk room={companyId} roomName={companyName} initial={initial} live={live} admin={admin} />;
}
