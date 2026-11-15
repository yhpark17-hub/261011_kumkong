import Link from "next/link";
import { connection } from "next/server";
import { BOARD_NAME, CATEGORY_LABEL, formatPostTime } from "@/lib/board-meta";
import { getCompany } from "@/lib/data";
import { formatShort, todayKST } from "@/lib/date";
import { difficultyWord } from "@/lib/review-meta";
import { listPosts } from "@/lib/server/board";
import { examCounts, listExams } from "@/lib/server/reviews";
import { ParticipantCount } from "../reviews/ParticipantCount";
import { CompanyAvatar, cn } from "../ui";
import { SectionHead, SoftLink } from "./HomeParts";

/** 홈 목록 — 옅은 회청색 둥근 바탕 하나 안에 줄 선 (상자 안 상자 없이) */
const LIST = "mt-3 rounded-[20px] bg-canvas-soft px-4 md:mt-4 md:rounded-[22px] md:px-[22px]";
const ROW = "border-t border-hairline first:border-t-0";
const EMPTY = "mt-3 rounded-[20px] bg-canvas-soft px-5 py-6 type-body-md text-ink-mute md:mt-4";

/**
 * 홈 '필기 후기 · 지금 받는 중' — 최근 치러진 시험부터 (컴퓨터 4줄 · 휴대폰 3줄).
 * 오른쪽은 오늘 시험 · 체감 난이도와 후기 수(많으면 루비 알약) · 아직 없으면 '첫 후기를 기다려요' (0명을 내세우지 않음)
 */
export async function HomeReviews() {
  await connection();
  const today = todayKST();
  const exams = listExams()
    .filter((e) => !e.expected && e.date <= today)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 4);
  const counts = await examCounts();

  return (
    <section aria-labelledby="home-reviews">
      <SectionHead id="home-reviews" title="필기 후기" meta="지금 받는 중" more={{ href: "/reviews" }} />
      {exams.length ? (
        <ul className={LIST}>
          {exams.map((e, i) => {
            const c = counts.get(e.id);
            const n = c?.n ?? 0;
            const isToday = e.date === today;
            return (
              <li key={e.id} className={cn(ROW, i === 3 && "max-md:hidden")}>
                <Link href={`/reviews/${e.id}`} className="group flex items-center gap-3 py-[13px] md:gap-3.5 md:px-0.5 md:py-[15px]">
                  <CompanyAvatar company={{ id: e.companyId, shortName: e.shortName, avatar: e.avatar, logo: e.logo }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold text-ink group-hover:underline md:text-[15.5px]">{e.companyName}</span>
                    <span className="mt-0.5 block truncate tabular text-[12.5px] text-ink-mute md:text-[13px]">
                      {e.label} · {formatShort(e.date)}
                    </span>
                  </span>
                  {isToday ? (
                    <span className="flex shrink-0 flex-col items-end gap-1 text-[12.5px] leading-snug font-bold text-ruby md:flex-row md:items-center md:gap-2 md:text-[13px]">
                      <span className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-ruby shadow-[0_0_0_4px_color-mix(in_srgb,var(--ruby)_16%,transparent)]" />
                        오늘 시험
                      </span>
                      {n > 0 && <ParticipantCount n={n} />}
                    </span>
                  ) : n > 0 ? (
                    <span className="flex shrink-0 items-center gap-2 text-[12.5px] font-bold text-ink-secondary md:text-[13px]">
                      {c?.avg != null && <span className="max-sm:hidden">{difficultyWord(c.avg)}</span>}
                      <ParticipantCount n={n} />
                    </span>
                  ) : (
                    <span className="shrink-0 text-right text-[12.5px] font-semibold text-ink-mute md:text-[13px]">첫 후기를 기다려요</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={EMPTY}>최근 치러진 필기가 없어요.</p>
      )}
      <SoftLink href="/reviews">
        시험 보셨나요? <b className="font-extrabold">
          <span className="hidden md:inline">체감 난이도 </span>30초 후기
        </b>
      </SoftLink>
    </section>
  );
}

/** 홈 '콩밭' — 새 글 (공지 빼고, 컴퓨터 4줄 · 휴대폰 3줄). 번호 · 제목 · 댓글 수(루비) */
export async function HomeBoard() {
  await connection();
  const today = todayKST();
  const { posts } = await listPosts({ page: 1 });
  const list = posts.filter((p) => !p.isNotice).slice(0, 4);

  return (
    <section aria-labelledby="home-board">
      <SectionHead id="home-board" title={BOARD_NAME} meta="로그인 없는 익명 게시판" more={{ href: "/board" }} />
      {list.length ? (
        <ol className={LIST}>
          {list.map((p, i) => {
            const org = p.companyId ? getCompany(p.companyId)?.shortName : null;
            const sub = [CATEGORY_LABEL[p.category], org, formatPostTime(p.createdAt, today), `조회 ${p.views.toLocaleString()}`].filter(Boolean).join(" · ");
            return (
              <li key={p.id} className={cn(ROW, i === 3 && "max-md:hidden")}>
                <Link href={`/board/${p.id}`} className="group flex items-center gap-3 py-[13px] md:gap-3.5 md:px-0.5 md:py-[15px]">
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[9px] bg-canvas tabular text-[13.5px] font-extrabold text-brand-text shadow-[0_1px_3px_rgba(13,37,61,0.1)]">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-baseline text-[15px] font-semibold text-ink md:text-[15.5px]">
                      <span className="truncate group-hover:underline">{p.title}</span>
                      {p.commentCount > 0 && (
                        <span className="ml-1.5 shrink-0 tabular font-extrabold text-hot" aria-label={`댓글 ${p.commentCount}개`}>
                          {p.commentCount}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate tabular text-[12.5px] text-ink-mute md:text-[13px]">{sub}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className={EMPTY}>아직 글이 없어요. 로그인 없이 첫 글을 남겨 보세요.</p>
      )}
      <SoftLink href="/board/write">
        궁금한 점, 필기·면접 정보를 <b className="font-extrabold">나눠 주세요</b>
      </SoftLink>
    </section>
  );
}
