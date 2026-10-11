"use client";

import { useActionState } from "react";
import { adminLogin, type AdminState } from "@/app/admin/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(adminLogin, { ok: false });
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1 block type-caption text-ink-secondary">운영자 비밀번호</span>
        <input name="password" type="password" required autoComplete="current-password" className="input w-full" autoFocus />
      </label>
      {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
