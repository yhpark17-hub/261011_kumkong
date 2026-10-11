import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { PostForm } from "@/components/board/PostForm";
import { DbSection } from "@/components/db/DbSection";
import { Card } from "@/components/ui";
import { BOARD_NAME } from "@/lib/board-meta";
import { COMPANIES, companyOptions } from "@/lib/data";
import { isAdmin } from "@/lib/server/security";

export const metadata: Metadata = {
  title: `글쓰기 - ${BOARD_NAME}`,
  robots: { index: false, follow: false },
};

export default function WritePage({ searchParams }: PageProps<"/board/write">) {
  return (
    <div className="mx-auto max-w-[840px] px-4 pt-8 pb-12 md:px-6 md:pt-12">
      <Link href="/board" className="link inline-flex items-center gap-1 type-caption">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        {BOARD_NAME} 목록
      </Link>
      <h1 className="mt-6 type-display-md text-ink">글쓰기</h1>
      <p className="mt-2 type-body-md text-ink-secondary">
        회원가입 없이 쓸 수 있어요. 비밀번호는 나중에 글을 고치거나 지울 때 필요하니 기억해 두세요.{" "}
        <Link href="/board/policy" className="link">
          이용 수칙
        </Link>
      </p>
      <div className="mt-8">
        <DbSection noticeTitle="콩밭(게시판)을 준비하고 있어요">
          <Card className="p-6 md:p-8">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-canvas-soft" />}>
              {searchParams.then(async (sp) => {
                const preset =
                  typeof sp.company === "string" && COMPANIES.some((c) => c.id === sp.company) ? sp.company : null;
                return (
                  <PostForm
                    mode="create"
                    admin={await isAdmin()}
                    companies={companyOptions()}
                    initial={preset ? { id: 0, category: "free", title: "", body: "", companyId: preset } : undefined}
                  />
                );
              })}
            </Suspense>
          </Card>
        </DbSection>
      </div>
    </div>
  );
}
