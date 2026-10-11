import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/board/AdminLoginForm";
import { Card, Logo } from "@/components/ui";

export const metadata: Metadata = {
  title: "운영자 로그인",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-[420px] px-4 pt-16 pb-24">
      <Card className="p-8">
        <Logo className="h-10 w-10" />
        <h1 className="mt-6 type-heading-lg text-ink">운영자 로그인</h1>
        <p className="mt-2 mb-6 type-body-md text-ink-mute">로그인하면 글·댓글이 운영자 배지와 함께 표시돼요.</p>
        <AdminLoginForm />
      </Card>
    </div>
  );
}
