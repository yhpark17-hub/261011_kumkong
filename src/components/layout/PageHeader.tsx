import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HeaderGlow } from "./MeshGlow";

/**
 * 화면 머리 — 그림 배너 대신 흰 띠 하나: (컴퓨터) 홈 › 화면 이름 · 굵은 제목 · 한 줄 설명 · 오른쪽 단추/검색.
 * 오른쪽에 홈과 같은 보라·분홍·주황 번짐을 옅게. 사이트 머리(흰색)와 이어지고, 아래 옅은 회청색 바탕에서 내용이 시작해요.
 */
export function PageHeader({
  title,
  desc,
  actions,
  id,
}: {
  title: string;
  desc?: React.ReactNode;
  /** 오른쪽 단추·검색창 (휴대폰은 설명 아래) */
  actions?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-hairline bg-canvas">
      <HeaderGlow />
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-4 px-4 pt-4 pb-5 md:flex-row md:items-end md:justify-between md:gap-8 md:px-6 md:pt-7 md:pb-8">
        <div className="min-w-0">
          <nav aria-label="현재 위치" className="hidden items-center gap-1 text-[13px] font-semibold text-ink-mute md:flex">
            <Link href="/" className="hover:text-ink">
              홈
            </Link>
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span aria-current="page">{title}</span>
          </nav>
          <h1 id={id} className="text-[24px] leading-tight font-extrabold tracking-[-0.035em] text-ink md:mt-2 md:text-[32px]">
            {title}
          </h1>
          {desc && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-secondary md:text-[15.5px]">{desc}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">{actions}</div>}
      </div>
    </div>
  );
}
