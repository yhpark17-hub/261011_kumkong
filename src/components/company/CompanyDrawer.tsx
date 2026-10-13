"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ExternalLink,
  FileText,
  Layers,
  MessageSquareWarning,
  X,
} from "lucide-react";
import { getCompany, getRecruitment, PHASE_TONE_CLASS, recruitmentPhase } from "@/lib/data";
import { formatLong } from "@/lib/date";
import { useTodayKey } from "@/lib/hooks";
import { FeedbackButton } from "../feedback/Feedback";
import { FavoriteButton } from "../client-ui";
import { BlindBadge, CategoryBadge, CompanyAvatar, cn } from "../ui";
import { RecruitTimeline } from "./RecruitTimeline";
import { EssayList, ExamDetail, QuickFacts, SectionTitle, SourceNote, TracksDetail } from "./sections";

export function CompanyDrawer({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const company = getCompany(companyId);
  const recruitment = getRecruitment(companyId);
  const today = useTodayKey();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!company || !recruitment) return null;
  const phase = today ? recruitmentPhase(recruitment, today) : null;
  // 이미 치러진 필기가 있으면 후기 페이지로 연결
  const doneWritten =
    today && recruitment.status !== "expected"
      ? recruitment.events
          .filter((e) => e.type === "written" && e.date <= today)
          .sort((a, b) => (a.date < b.date ? -1 : 1))
          .at(-1)
      : undefined;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-brand-dark/40"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "absolute flex flex-col bg-canvas shadow-level-2 outline-none",
          // 모바일: 바텀시트, 데스크톱: 우측 패널 (floating panel · Level 2)
          "animate-drawer-up inset-x-0 bottom-0 max-h-[90dvh] rounded-t-xl",
          "md:animate-drawer-right md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[520px] md:rounded-none md:rounded-l-xl",
        )}
      >
        {/* 헤더 */}
        <div className="border-b border-hairline px-6 pt-3 pb-6 md:pt-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline-input md:hidden" />
          <div className="flex items-start gap-4">
            <CompanyAvatar company={company} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={company.category} />
                {company.blind !== "unknown" && <BlindBadge blind={company.blind} />}
                {phase && <span className={cn("tag", PHASE_TONE_CLASS[phase.tone])}>{phase.label}</span>}
              </div>
              <h2 id="drawer-title" className="mt-2 type-display-md text-ink">
                {company.name}
              </h2>
              <p className="mt-1 truncate text-ink-mute">{recruitment.title}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <FavoriteButton companyId={company.id} companyName={company.name} />
              <button
                type="button"
                onClick={onClose}
                className="btn btn-icon text-ink-mute hover:bg-canvas-soft hover:text-ink"
                aria-label="닫기"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {recruitment.status === "expected" && recruitment.events.length > 0 && (
            <p className="card-cream p-4 type-caption text-ink-secondary">
              <span className="text-lemon">예상 일정</span> · 아직 올해 공고가 나오지 않아 전년도 일정을 기준으로
              표시했어요. 공고가 나오면 바로 업데이트됩니다.
            </p>
          )}

          <section>
            <SectionTitle icon={CalendarClock}>
              전형 일정
            </SectionTitle>
            <RecruitTimeline recruitment={recruitment} />
            {recruitment.note && <p className="mt-4 type-caption text-ink-mute">※ {recruitment.note}</p>}
            <SourceNote recruitment={recruitment} />
          </section>

          <section>
            <SectionTitle icon={Layers}>한눈에 보기</SectionTitle>
            <QuickFacts company={company} />
          </section>

          <section>
            <SectionTitle
              icon={BookOpen}
              aside={
                doneWritten && (
                  <Link
                    href={`/reviews/${company.id}-${doneWritten.date}`}
                    onClick={onClose}
                    className="link inline-flex items-center gap-1 type-caption"
                  >
                    응시자 체감 난이도
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Link>
                )
              }
            >
              필기 구성
            </SectionTitle>
            <ExamDetail company={company} />
          </section>

          <section>
            <SectionTitle icon={Layers}>모집 직렬</SectionTitle>
            <TracksDetail recruitment={recruitment} />
          </section>

          <section>
            <SectionTitle icon={FileText}>자기소개서 항목</SectionTitle>
            <EssayList recruitment={recruitment} />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas-soft px-4 py-3">
            <p className="type-caption text-ink-mute">
              최종 확인 {formatLong(recruitment.updatedAt)} · 공고와 다른 점이 있나요?
            </p>
            <FeedbackButton
              kind="correction"
              companyId={company.id}
              companyName={company.name}
              className="link inline-flex items-center gap-1 type-caption"
            >
              <MessageSquareWarning className="h-3.5 w-3.5" strokeWidth={1.75} />
              정보 제보하기
            </FeedbackButton>
          </div>
        </div>

        {/* 하단 액션 — 한 영역에 filled pill 하나 */}
        <div className="flex gap-2 border-t border-hairline px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {(recruitment.postingUrl || company.recruitUrl) && (
            <a
              href={recruitment.postingUrl ?? company.recruitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex-1"
            >
              채용 공고 보기
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
            </a>
          )}
          <Link href={`/companies/${company.id}`} onClick={onClose} className="btn btn-primary flex-1">
            기관 상세 보기
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </div>
  );
}
