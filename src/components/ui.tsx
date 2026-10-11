import Image from "next/image";
import { BLIND_META, CATEGORY_META, EVENT_META, avatarTone } from "@/lib/meta";
import type { Blind, Category, Company, EventType } from "@/lib/types";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** 금콩 로고 — brand-dark-900 바탕에 cream→lemon 그라디언트 콩 */
export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="kk-bean" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5e9d4" />
          <stop offset="1" stopColor="#ffa26b" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#1c1e54" />
      <path
        d="M20.6 7.4c3.7 1.6 5 6.5 3 10.9-1.4 3.1-4.7 4.7-6.5 6.4-1.7 1.6-4.5 1.9-6.5.2-2.4-2-2.3-5.2-.6-7.3 1.3-1.6 3.3-2 4.1-3.9.9-2 .9-4.7 2.9-6 1-.7 2.3-.8 3.6-.3z"
        fill="url(#kk-bean)"
      />
      <path d="M19 10.6c-1.3.6-1.6 2.2-2 3.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** 일정 유형 태그 — pill-tag 형태 */
export function EventTag({
  type,
  label,
  size = "md",
  className,
}: {
  type: EventType;
  /** 회차 라벨 (예: "1차 면접 ① 토론") */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const m = EVENT_META[type];
  return (
    <span
      className={cn(
        size === "sm" ? "tag" : "tag type-caption !px-3",
        m.soft,
        m.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {label ?? m.label}
    </span>
  );
}

const AVATAR_PX = { sm: 32, md: 40, lg: 64 } as const;

/**
 * 기관 아바타 — 로고가 있으면 흰 타일 위에 로고, 없으면 약칭 글자.
 * 로고는 각 기관의 상표이며 기관 식별 목적으로만 표시합니다.
 */
export function CompanyAvatar({
  company,
  size = "md",
}: {
  company: Pick<Company, "id" | "shortName" | "avatar" | "logo">;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "sm"
      ? "h-8 w-8 type-micro-cap rounded-md"
      : size === "lg"
        ? "h-16 w-16 type-body-lg !font-normal rounded-lg"
        : "h-10 w-10 type-caption rounded-md";
  if (company.logo) {
    const px = AVATAR_PX[size];
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden border border-hairline bg-[#ffffff]",
          dims,
          size === "lg" ? "p-2" : "p-1",
        )}
        aria-hidden
      >
        <Image src={company.logo} alt="" width={px} height={px} className="h-full w-full object-contain" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-on-primary",
        avatarTone(company.id),
        dims,
      )}
      aria-hidden
    >
      {company.avatar ?? company.shortName.slice(0, 3)}
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return <span className="tag bg-canvas-soft text-ink-secondary">{CATEGORY_META[category].label}</span>;
}

export function BlindBadge({ blind }: { blind: Blind }) {
  const m = BLIND_META[blind];
  return (
    <span className={cn("tag", m.tone)} title={m.desc}>
      {m.label}
    </span>
  );
}

/** 정보 칩 (과목·직렬 등) — hairline 테두리 pill */
export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-hairline bg-canvas px-3 py-1 type-caption text-ink-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** card-feature-light: canvas + hairline + rounded lg(12px), 선택적으로 Level 1 그림자 */
export function Card({
  children,
  className,
  id,
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag id={id} className={cn("card shadow-level-1", className)}>
      {children}
    </Tag>
  );
}

/** 섹션 위 작은 라벨 (micro-cap eyebrow) */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("type-micro-cap text-primary-text", className)}>{children}</p>;
}
