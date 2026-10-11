"use client";

import { useActionState, useState } from "react";
import { createPost, updatePost, type ActionState } from "@/app/board/actions";
import { BOARD_CATEGORIES, type BoardCategory } from "@/lib/board-meta";
import { cn } from "../ui";

interface CompanyOption {
  id: string;
  name: string;
  group: string;
}

export function PostForm({
  mode,
  admin,
  companies,
  initial,
}: {
  mode: "create" | "edit";
  admin: boolean;
  companies: CompanyOption[];
  initial?: { id: number; category: BoardCategory; title: string; body: string; companyId: string | null };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    mode === "create" ? createPost : updatePost,
    { ok: false },
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const groups = [...new Set(companies.map((c) => c.group))];
  const maxBody = admin ? 20000 : 5000;

  return (
    <form action={action} className="space-y-4">
      {mode === "edit" && initial && <input type="hidden" name="id" value={initial.id} />}
      {/* 스팸봇 방지용 숨은 칸 */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {admin && (
        <p className="card-cream flex items-center gap-2 p-3 type-caption text-ink-secondary">
          <span className="tag bg-brand-dark text-on-primary">운영자</span>
          운영자 계정으로 작성돼요. 닉네임은 &lsquo;금콩 운영자&rsquo;로 표시됩니다.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1 block type-caption text-ink-secondary">말머리</span>
          <select name="category" defaultValue={initial?.category ?? "free"} className="input w-full">
            {BOARD_CATEGORIES.filter((c) => !c.adminOnly || admin).map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        {mode === "create" && (
          <label className="block">
            <span className="mb-1 block type-caption text-ink-secondary">관련 기관 (선택)</span>
            <select name="companyId" defaultValue={initial?.companyId ?? ""} className="input w-full">
              <option value="">선택 안 함</option>
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {companies
                    .filter((c) => c.group === g)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="block">
        <span className="mb-1 flex justify-between type-caption text-ink-secondary">
          제목 <span className="tabular text-ink-mute">{title.length}/80</span>
        </span>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          className="input w-full"
          placeholder="제목을 입력하세요"
        />
      </label>

      <label className="block">
        <span className="mb-1 flex justify-between type-caption text-ink-secondary">
          내용{" "}
          <span className="tabular text-ink-mute">
            {body.length}/{maxBody}
          </span>
        </span>
        <textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={maxBody}
          required
          rows={admin ? 20 : 12}
          className="input w-full resize-y leading-relaxed"
          placeholder={
            admin
              ? "## 소제목, **굵게**, - 목록, > 인용, [링크 이름](https://...) 형식을 쓸 수 있어요."
              : "시험 문제 원문을 그대로 옮기는 것은 금지돼요. 출제 경향·체감 난이도 위주로 적어 주세요."
          }
        />
        {admin && (
          <span className="mt-1 block type-micro text-ink-mute">
            운영자 글은 간단한 서식(## 소제목 · ### 작은 제목 · **굵게** · - 목록 · 1. 번호 목록 · &gt; 인용 · [이름](링크))이
            적용돼요.
          </span>
        )}
      </label>

      {!admin && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block type-caption text-ink-secondary">닉네임</span>
            <input
              name="nickname"
              maxLength={12}
              placeholder="ㅇㅇ"
              className="input w-full"
              disabled={mode === "edit"}
            />
          </label>
          <label className="block">
            <span className="mb-1 block type-caption text-ink-secondary">
              비밀번호 {mode === "create" ? "(수정·삭제할 때 필요)" : "(작성할 때 정한 비밀번호)"}
            </span>
            <input name="password" type="password" minLength={4} maxLength={30} required className="input w-full" />
          </label>
        </div>
      )}

      {admin && mode === "create" && (
        <label className="flex items-center gap-2 type-body-md text-ink-secondary">
          <input type="checkbox" name="notice" className="h-4 w-4 accent-[#533afd]" />
          목록 맨 위에 공지로 고정
        </label>
      )}

      {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <button type="submit" disabled={pending} className={cn("btn btn-primary", pending && "opacity-60")}>
          {pending ? "등록 중…" : mode === "create" ? "등록" : "수정"}
        </button>
      </div>
    </form>
  );
}
