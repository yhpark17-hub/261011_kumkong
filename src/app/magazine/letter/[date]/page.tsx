import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { isDateKey, letterHref } from "@/lib/news-meta";
import { getIssue } from "@/lib/server/briefing";
import { isAdmin } from "@/lib/server/security";

/** 날짜만 있는 예전 주소 → 그날 아침판 (없으면 금콩 스터디) */
export default function LetterDatePage({ params }: PageProps<"/magazine/letter/[date]">) {
  return <Suspense fallback={null}>{params.then(({ date }) => <Go date={date} />)}</Suspense>;
}

async function Go({ date }: { date: string }) {
  await connection();
  if (!isDateKey(date)) notFound();
  const admin = await isAdmin();
  const morning = await getIssue(date, "morning", { admin });
  if (morning) redirect(letterHref(date, "morning"));
  const noon = await getIssue(date, "noon", { admin });
  if (noon) redirect(letterHref(date, "noon"));
  notFound();
  return null;
}
