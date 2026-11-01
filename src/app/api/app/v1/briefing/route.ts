import { briefingMinutes, isDateKey, isIssueEdition, issueLabel, type BriefingIssue } from "@/lib/news-meta";
import { appJson } from "@/lib/server/app-api";
import { appIssue, appStory } from "@/lib/server/app-briefing";
import { adjacentIssues, arrangeLetter, getIssue, issueItems, latestIssue } from "@/lib/server/briefing";
import { dbConfigured } from "@/lib/server/db";

/**
 * 앱: 브리핑 한 호 — ?edition=morning|noon (기본 아침판), ?date=YYYY-MM-DD (없으면 가장 최근 호)
 * 아침판은 기사마다 카드 장 목록까지, 금콩 스터디는 호 정보만 (앱이 웹 화면으로 열어요).
 * 예약 발행이 퍼지 없이 열리므로 CDN에는 짧게만 둬요.
 */
const CACHE = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

const near = (i: BriefingIssue | null) => i && { date: i.date, edition: i.edition, label: issueLabel(i), title: i.title };

export async function GET(req: Request) {
  if (!dbConfigured()) return appJson({ error: "브리핑을 준비 중이에요" }, { status: 503 });
  const sp = new URL(req.url).searchParams;
  const ed = sp.get("edition");
  const edition = isIssueEdition(ed) ? ed : "morning";
  const date = sp.get("date");

  const issue = isDateKey(date) ? await getIssue(date, edition) : await latestIssue(edition);
  if (!issue) return appJson({ error: "아직 발행된 브리핑이 없어요" }, { status: 404, headers: CACHE });

  const [items, around] = await Promise.all([issueItems(issue.date, issue.edition), adjacentIssues(issue.date, issue.edition)]);
  const content = arrangeLetter(items);
  return appJson(
    {
      issue: appIssue(issue, briefingMinutes(issue, items)),
      stories: issue.edition === "morning" ? content.all.map((n, i) => appStory(n, i + 1)) : [],
      prev: near(around.prev),
      next: near(around.next),
    },
    { headers: CACHE },
  );
}
