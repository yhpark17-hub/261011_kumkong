"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  Bold,
  CheckSquare,
  ExternalLink,
  Eye,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  NotebookPen,
  PenLine,
  Quote,
  Sparkles,
  Table,
  Trash2,
  X,
} from "lucide-react";
import { deleteArticle, saveArticle, type ArticleFormState } from "@/app/admin/article-actions";
import { Markdown } from "@/components/magazine/Markdown";
import {
  CATEGORY_INFO,
  MAGAZINE_CATEGORIES,
  TEMPLATES,
  computeReadMinutes,
  isMagazineCategory,
  summaryLines,
  type MagazineCategory,
} from "@/lib/magazine-meta";
import { uploadFile } from "@/lib/upload-client";
import { cn } from "../ui";

export interface EditorInitial {
  id: number | null;
  category: MagazineCategory;
  title: string;
  summary: string;
  coverUrl: string;
  body: string;
  tags: string;
  author: string;
  featured: boolean;
  /** 서버에서 계산: 지금 상태에 맞는 발행 방식 */
  mode: "draft" | "now" | "schedule";
  /** datetime-local 값 (한국 시각) */
  publishAt: string;
  updatedAt: number | null;
  source: string;
  statusLabel: string;
}

type Fields = Pick<EditorInitial, "category" | "title" | "summary" | "coverUrl" | "body" | "tags" | "author" | "featured" | "mode" | "publishAt">;

const pick = (i: EditorInitial): Fields => ({
  category: i.category,
  title: i.title,
  summary: i.summary,
  coverUrl: i.coverUrl,
  body: i.body,
  tags: i.tags,
  author: i.author,
  featured: i.featured,
  mode: i.mode,
  publishAt: i.publishAt,
});

/** 예약 시각은 예약 발행일 때만 비교 */
const same = (a: Fields, b: Fields) =>
  (Object.keys(a) as (keyof Fields)[]).every((k) => (k === "publishAt" && a.mode !== "schedule") || a[k] === b[k]);

/** 제출한 폼 값 그대로 (저장 성공 시 기준점) */
const fromForm = (fd: FormData): Fields => ({
  category: (isMagazineCategory(fd.get("category")) ? fd.get("category") : "knowledge") as MagazineCategory,
  title: String(fd.get("title") ?? ""),
  summary: String(fd.get("summary") ?? ""),
  coverUrl: String(fd.get("coverUrl") ?? ""),
  body: String(fd.get("body") ?? ""),
  tags: String(fd.get("tags") ?? ""),
  author: String(fd.get("author") ?? ""),
  featured: fd.get("featured") === "on",
  mode: (String(fd.get("mode") ?? "draft") as Fields["mode"]),
  publishAt: String(fd.get("publishAt") ?? ""),
});

/* 이 브라우저에 작성 중인 내용 임시 보관 (저장 전 창을 닫아도 복구) */
const draftKey = (id: number | null) => `kumkong:admin-draft:${id ?? "new"}`;
function readDraft(id: number | null): string | null {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
}
const noopSubscribe = () => () => {};

export function ArticleEditor({ initial }: { initial: EditorInitial }) {
  const [f, setF] = useState<Fields>(() => pick(initial));
  const [saved, setSaved] = useState<Fields>(() => pick(initial));
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dismissedDraft, setDismissedDraft] = useState(false);
  const [statusLabel, setStatusLabel] = useState(initial.statusLabel);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const [state, action, pending] = useActionState<ArticleFormState, FormData>(async (prev, fd) => {
    if (!initial.id) clearDraft(); // 새 글은 저장되면 편집 화면으로 이동하므로 먼저 정리
    const res = await saveArticle(prev, fd);
    if (res.ok) {
      setSaved(fromForm(fd));
      clearDraft();
      setStatusLabel(
        res.status === 0 ? "임시저장" : res.publishedAt && res.publishedAt > (res.savedAt ?? 0) ? "예약 발행" : "공개 중",
      );
    }
    return res;
  }, { ok: false });

  const dirty = !same(f, saved);
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setF((prev) => ({ ...prev, [k]: v }));

  function clearDraft() {
    try {
      localStorage.removeItem(draftKey(initial.id));
    } catch {
      /* 무시 */
    }
  }

  // 작성 중 내용 자동 보관 (0.8초 뒤)
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(initial.id), JSON.stringify({ ...f, at: Date.now() }));
      } catch {
        /* 무시 */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [f, dirty, initial.id]);

  // 저장 안 한 채 나가려 하면 확인
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Ctrl+S 저장
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 복구할 임시 보관본
  const draftRaw = useSyncExternalStore(noopSubscribe, () => readDraft(initial.id), () => null);
  let restorable: (Fields & { at: number }) | null = null;
  if (draftRaw && !dismissedDraft) {
    try {
      const d = JSON.parse(draftRaw) as Fields & { at: number };
      if (d.at > (initial.updatedAt ?? 0) && !same({ ...pick(initial), ...stripAt(d) }, pick(initial))) restorable = d;
    } catch {
      restorable = null;
    }
  }

  /* ---------------- 본문 편집 도우미 ---------------- */

  function edit(transform: (text: string, s: number, e: number) => { text: string; s: number; e: number }) {
    const ta = bodyRef.current;
    if (!ta) return;
    const r = transform(f.body, ta.selectionStart, ta.selectionEnd);
    set("body", r.text);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(r.s, r.e);
    });
  }

  const wrap = (before: string, after: string, placeholder: string) =>
    edit((t, s, e) => {
      const sel = t.slice(s, e) || placeholder;
      const text = t.slice(0, s) + before + sel + after + t.slice(e);
      return { text, s: s + before.length, e: s + before.length + sel.length };
    });

  const prefixLines = (prefix: (i: number) => string) =>
    edit((t, s, e) => {
      const start = t.lastIndexOf("\n", s - 1) + 1;
      const endIdx = t.indexOf("\n", e);
      const end = endIdx === -1 ? t.length : endIdx;
      const block = t.slice(start, end) || "";
      const lines = block.split("\n").map((l, i) => prefix(i) + l.replace(/^(#{1,3}\s|>\s?|[-*]\s(\[[ xX]\]\s)?|\d+[.)]\s)/, ""));
      const out = lines.join("\n");
      return { text: t.slice(0, start) + out + t.slice(end), s: start + out.length, e: start + out.length };
    });

  /** 커서 위치에 빈 줄로 감싼 블록 넣기 */
  const insertBlock = (block: string, selectFrom?: number, selectLen?: number) =>
    edit((t, s) => {
      const before = t.slice(0, s);
      const after = t.slice(s);
      const lead = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
      const tail = after.startsWith("\n\n") || after.length === 0 ? "" : after.startsWith("\n") ? "\n" : "\n\n";
      const text = before + lead + block + tail + after;
      const at = before.length + lead.length;
      return selectFrom != null ? { text, s: at + selectFrom, e: at + selectFrom + (selectLen ?? 0) } : { text, s: at + block.length, e: at + block.length };
    });

  const callout = (kind: string, title: string) => {
    const block = `> [!${kind}] ${title}\n> 내용을 적어 주세요`;
    insertBlock(block, block.indexOf("내용을 적어 주세요"), "내용을 적어 주세요".length);
  };

  async function uploadImages(files: FileList | null, target: "body" | "cover") {
    if (!files?.length) return;
    setUploadError(null);
    const list = [...files];
    const urls: string[] = [];
    for (let i = 0; i < list.length; i++) {
      setBusy(list.length > 1 ? `사진 올리는 중 ${i + 1}/${list.length}` : "사진 올리는 중");
      try {
        const a = await uploadFile(list[i], "magazine");
        urls.push(a.url);
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "사진을 올리지 못했어요.");
      }
    }
    setBusy(null);
    if (!urls.length) return;
    if (target === "cover") set("coverUrl", urls[0]);
    else insertBlock(urls.map((u) => `![](${u})`).join("\n"));
    if (imageInput.current) imageInput.current.value = "";
    if (coverInput.current) coverInput.current.value = "";
  }

  function applyTemplate(key: string) {
    const t = TEMPLATES.find((x) => x.key === key);
    if (!t) return;
    if (f.body.trim() && !window.confirm("지금 본문을 틀로 바꿀까요? (작성한 내용은 사라져요)")) return;
    const now = new Date(Date.now() + 9 * 3600_000);
    const dated = t.title.replace("M월 D일", `${now.getUTCMonth() + 1}월 ${now.getUTCDate()}일`);
    setF((prev) => ({
      ...prev,
      category: t.category,
      title: prev.title.trim() ? prev.title : dated,
      summary: t.summary,
      body: t.body,
    }));
  }

  const tool = "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-md px-1.5 text-ink-secondary hover:bg-canvas-soft hover:text-ink";
  const points = summaryLines(f.summary);
  const minutes = computeReadMinutes(f.body);

  return (
    <form ref={formRef} action={action} className="space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {restorable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-canvas-cream px-4 py-3">
          <p className="type-caption text-ink-secondary">저장하지 않고 닫은 작성 내용이 이 브라우저에 남아 있어요.</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => {
                if (restorable) setF({ ...pick(initial), ...stripAt(restorable) });
                setDismissedDraft(true);
              }}
            >
              불러오기
            </button>
            <button
              type="button"
              className="btn btn-sm btn-toggle"
              onClick={() => {
                clearDraft();
                setDismissedDraft(true);
              }}
            >
              버리기
            </button>
          </div>
        </div>
      )}

      {/* 상단: 상태 + 저장 */}
      <div className="sticky top-[68px] z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-canvas/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-lg md:border md:px-4">
        <div className="flex flex-wrap items-center gap-2 type-caption text-ink-mute">
          <span className={cn("tag", statusLabel === "공개 중" ? "bg-ev-final-soft text-ev-final" : statusLabel === "예약 발행" ? "bg-ev-written-soft text-primary-text" : "bg-canvas-soft text-ink-secondary")}>
            {statusLabel}
          </span>
          {initial.source === "auto" && <span className="tag bg-canvas-cream text-lemon">자동 초안</span>}
          <span className="tabular">{f.body.length.toLocaleString()}자 · {minutes}분 분량</span>
          {dirty ? <span className="text-ev-doc">저장 안 됨</span> : state.ok && <span className="text-ev-final">저장됨</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {initial.id && (
            <Link href={`/magazine/${initial.id}`} target="_blank" className="btn btn-sm btn-toggle">
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              페이지로 보기
            </Link>
          )}
          <button type="submit" disabled={pending || Boolean(busy)} className={cn("btn btn-sm btn-primary", (pending || busy) && "opacity-60")}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
            {f.mode === "draft" ? "임시저장" : f.mode === "schedule" ? "예약 발행 저장" : initial.statusLabel === "공개 중" ? "수정 저장" : "발행하기"}
          </button>
        </div>
      </div>
      {state.error && <p className="rounded-md bg-ev-doc-soft p-3 type-caption text-ev-doc">{state.error}</p>}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ---------------- 쓰기 ---------------- */}
        <div className={cn("min-w-0 space-y-4", tab === "preview" && "hidden xl:block")}>
          <div className="flex gap-2 xl:hidden">
            <TabButton on={tab === "write"} onClick={() => setTab("write")} icon={<PenLine className="h-4 w-4" strokeWidth={1.75} />}>
              쓰기
            </TabButton>
            <TabButton on={false} onClick={() => setTab("preview")} icon={<Eye className="h-4 w-4" strokeWidth={1.75} />}>
              미리보기
            </TabButton>
          </div>

          <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-1 block type-caption text-ink-secondary">카테고리</span>
              <select
                name="category"
                value={f.category}
                onChange={(e) => isMagazineCategory(e.target.value) && set("category", e.target.value)}
                className="input w-full"
              >
                {MAGAZINE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block type-caption text-ink-secondary">틀 불러오기</span>
              <select value="" onChange={(e) => applyTemplate(e.target.value)} className="input w-full">
                <option value="">틀을 고르면 본문 구조가 채워져요</option>
                {TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 flex justify-between type-caption text-ink-secondary">
              제목 <span className="tabular text-ink-mute">{f.title.length}/120</span>
            </span>
            <input name="title" value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={120} required className="input w-full !text-[17px]" placeholder="읽고 싶어지는 제목" />
          </label>

          <label className="block">
            <span className="mb-1 flex justify-between type-caption text-ink-secondary">
              <span>
                요약 <span className="text-ink-mute">— 줄마다 한 항목 · {f.category === "briefing" ? "브리핑은 ‘바쁘면 이것만’ 3줄 요약으로 크게 보여요" : "목록 카드와 검색 결과 설명에 쓰여요"}</span>
              </span>
              <span className="tabular text-ink-mute">{f.summary.length}/600</span>
            </span>
            <textarea name="summary" value={f.summary} onChange={(e) => set("summary", e.target.value)} rows={3} maxLength={600} className="input w-full resize-y leading-relaxed" />
          </label>

          {/* 표지 */}
          <div>
            <span className="mb-1 block type-caption text-ink-secondary">표지 이미지 (선택 · 없으면 카테고리 색으로 표시)</span>
            <input type="hidden" name="coverUrl" value={f.coverUrl} />
            <input ref={coverInput} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={(e) => uploadImages(e.target.files, "cover")} />
            {f.coverUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-hairline">
                {/* eslint-disable-next-line @next/next/no-img-element -- 업로드한 표지 미리보기 */}
                <img src={f.coverUrl} alt="" className="aspect-[16/9] w-full object-cover" />
                <button type="button" onClick={() => set("coverUrl", "")} className="absolute top-2 right-2 btn btn-sm btn-toggle bg-canvas">
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                  빼기
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => coverInput.current?.click()} disabled={Boolean(busy)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-hairline-input py-6 type-caption text-ink-secondary hover:bg-canvas-soft">
                <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
                표지 올리기 (16:9 권장)
              </button>
            )}
          </div>

          {/* 본문 */}
          <div>
            <span className="mb-1 block type-caption text-ink-secondary">본문</span>
            <div className="rounded-lg border border-hairline-input focus-within:border-primary">
              <div className="flex flex-wrap items-center gap-0.5 border-b border-hairline px-1.5 py-1" role="toolbar" aria-label="서식">
                <button type="button" className={tool} title="소제목 (목차에 들어가요)" onClick={() => prefixLines(() => "## ")}>
                  <Heading2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="작은 제목" onClick={() => prefixLines(() => "### ")}>
                  <Heading3 className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <span className="mx-1 h-5 w-px bg-hairline" />
                <button type="button" className={tool} title="굵게 (Ctrl+B)" onClick={() => wrap("**", "**", "굵게")}>
                  <Bold className="h-4 w-4" strokeWidth={2} />
                </button>
                <button type="button" className={tool} title="형광펜" onClick={() => wrap("==", "==", "강조할 말")}>
                  <Highlighter className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="링크" onClick={() => wrap("[", "](https://)", "링크 이름")}>
                  <Link2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <span className="mx-1 h-5 w-px bg-hairline" />
                <button type="button" className={tool} title="목록" onClick={() => prefixLines(() => "- ")}>
                  <List className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="번호 목록" onClick={() => prefixLines((i) => `${i + 1}. `)}>
                  <ListOrdered className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="체크리스트" onClick={() => prefixLines(() => "- [ ] ")}>
                  <CheckSquare className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="인용" onClick={() => prefixLines(() => "> ")}>
                  <Quote className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <span className="mx-1 h-5 w-px bg-hairline" />
                <button type="button" className={tool} title="팁 상자" onClick={() => callout("팁", "준비 팁")}>
                  <Lightbulb className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="주의 상자" onClick={() => callout("주의", "주의할 점")}>
                  <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="요약 상자" onClick={() => callout("요약", "핵심 정리")}>
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="용어 상자" onClick={() => callout("용어", "용어 이름")}>
                  <NotebookPen className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="표" onClick={() => insertBlock("| 항목 | 내용 |\n| --- | --- |\n|  |  |\n|  |  |", 2, 2)}>
                  <Table className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="구분선" onClick={() => insertBlock("---")}>
                  <Minus className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <button type="button" className={tool} title="출처 줄 (뉴스)" onClick={() => insertBlock("출처: [언론사](https://)", 5, 3)}>
                  <span className="type-micro">출처</span>
                </button>
                <span className="mx-1 h-5 w-px bg-hairline" />
                <input ref={imageInput} type="file" accept=".jpg,.jpeg,.png,.webp,.gif" multiple className="hidden" onChange={(e) => uploadImages(e.target.files, "body")} />
                <button type="button" className={cn(tool, "px-2")} title="사진 넣기 (여러 장 가능 · 웹툰은 순서대로)" onClick={() => imageInput.current?.click()} disabled={Boolean(busy)}>
                  <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
                  <span className="type-caption">사진</span>
                </button>
                {busy && (
                  <span className="ml-1 inline-flex items-center gap-1 type-caption text-primary-text">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    {busy}
                  </span>
                )}
              </div>
              <textarea
                ref={bodyRef}
                name="body"
                value={f.body}
                onChange={(e) => set("body", e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                    e.preventDefault();
                    wrap("**", "**", "굵게");
                  }
                }}
                rows={26}
                required
                className="block min-h-[420px] w-full resize-y rounded-b-lg bg-canvas px-4 py-3 font-mono text-[14px] leading-[1.75] text-ink outline-none"
                placeholder={"## 소제목\n\n본문을 적어 주세요. 위 도구로 서식을 넣을 수 있어요."}
              />
            </div>
            {uploadError && <p className="mt-2 type-caption text-ev-doc">{uploadError}</p>}
            <details className="mt-2 type-caption text-ink-mute">
              <summary className="cursor-pointer select-none">서식 도움말</summary>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                <li>## 소제목 · ### 작은 제목 (목차 자동)</li>
                <li>**굵게** · ==형광펜== · [이름](주소)</li>
                <li>- 목록 · 1. 번호 · - [ ] 체크리스트</li>
                <li>&gt; [!팁] 제목 + 다음 줄 &gt; 내용 (팁·주의·요약·포인트·용어·메모)</li>
                <li>| 표 | 머리 | 다음 줄 | --- | --- |</li>
                <li>출처: [언론사](주소) — 뉴스 출처 줄</li>
                <li>![설명](사진) — 줄마다 한 장, 웹툰은 이어 붙여 보여요</li>
                <li>--- 구분선 · Ctrl+S 저장 · Ctrl+B 굵게</li>
              </ul>
            </details>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block type-caption text-ink-secondary">태그 (쉼표로 구분 · 최대 8개)</span>
              <input name="tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} className="input w-full" placeholder="NCS, 한국은행, 면접" />
            </label>
            <label className="block">
              <span className="mb-1 block type-caption text-ink-secondary">글쓴이</span>
              <input name="author" value={f.author} onChange={(e) => set("author", e.target.value)} maxLength={30} className="input w-full" />
            </label>
          </div>

          {/* 발행 */}
          <fieldset className="rounded-lg border border-hairline p-4">
            <legend className="px-1 type-caption text-ink-secondary">발행</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["draft", "임시저장", "나만 보기"],
                  ["now", "공개", "바로 사이트에 노출"],
                  ["schedule", "예약 발행", "정한 시각에 자동 공개"],
                ] as const
              ).map(([key, label, desc]) => (
                <label
                  key={key}
                  className={cn(
                    "flex min-w-[140px] flex-1 cursor-pointer flex-col rounded-md border px-3 py-2",
                    f.mode === key ? "border-primary bg-ev-written-soft" : "border-hairline hover:border-hairline-input",
                  )}
                >
                  <span className="flex items-center gap-2 type-body-md text-ink">
                    <input type="radio" name="mode" value={key} checked={f.mode === key} onChange={() => set("mode", key)} className="accent-[#533afd]" />
                    {label}
                  </span>
                  <span className="pl-5 type-micro text-ink-mute">{desc}</span>
                </label>
              ))}
            </div>
            {f.mode === "schedule" && (
              <label className="mt-3 flex flex-wrap items-center gap-2 type-caption text-ink-secondary">
                공개 시각 (한국 시간)
                <input type="datetime-local" name="publishAt" value={f.publishAt} onChange={(e) => set("publishAt", e.target.value)} className="input" required />
              </label>
            )}
            <label className="mt-3 flex items-center gap-2 type-body-md text-ink-secondary">
              <input type="checkbox" name="featured" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[#533afd]" />
              에디터 추천 (매거진 첫 화면 상단에 크게)
            </label>
          </fieldset>
        </div>

        {/* ---------------- 미리보기 ---------------- */}
        <div className={cn("min-w-0", tab === "write" && "hidden xl:block")}>
          <div className="mb-4 flex gap-2 xl:hidden">
            <TabButton on={false} onClick={() => setTab("write")} icon={<PenLine className="h-4 w-4" strokeWidth={1.75} />}>
              쓰기
            </TabButton>
            <TabButton on onClick={() => setTab("preview")} icon={<Eye className="h-4 w-4" strokeWidth={1.75} />}>
              미리보기
            </TabButton>
          </div>
          <div className="rounded-xl border border-hairline bg-canvas xl:sticky xl:top-36 xl:max-h-[calc(100vh-10rem)] xl:overflow-y-auto">
            <p className="sticky top-0 z-10 border-b border-hairline bg-canvas-soft/95 px-5 py-2 type-micro-cap text-ink-mute backdrop-blur">미리보기</p>
            <div className="px-5 py-6 md:px-8">
              <span className={cn("tag", CATEGORY_INFO[f.category].tone)}>{CATEGORY_INFO[f.category].label}</span>
              <h1 className="mt-3 type-heading-lg text-ink [word-break:keep-all]">{f.title || "제목"}</h1>
              {f.category !== "briefing" && points.length > 0 && <p className="mt-3 type-body-lg text-ink-secondary">{points.join(" ")}</p>}
              {f.category === "briefing" && points.length > 0 && (
                <ol className="mt-5 space-y-2 rounded-xl bg-brand-dark p-5 text-on-primary">
                  {points.map((p, i) => (
                    <li key={i} className="flex gap-2 type-body-md">
                      <span className="tabular text-on-primary/60">{i + 1}</span>
                      {p}
                    </li>
                  ))}
                </ol>
              )}
              {f.coverUrl && f.category !== "webtoon" && (
                // eslint-disable-next-line @next/next/no-img-element -- 미리보기
                <img src={f.coverUrl} alt="" className="mt-6 aspect-[16/9] w-full rounded-lg border border-hairline object-cover" />
              )}
              <div className="mt-8">
                {f.body.trim() ? (
                  <Markdown source={f.body} variant={f.category === "briefing" ? "briefing" : f.category === "webtoon" ? "webtoon" : "article"} />
                ) : (
                  <p className="type-body-md text-ink-mute">본문을 쓰면 여기에 실제 모습으로 보여요.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {initial.id && (
        <div className="flex justify-end border-t border-hairline pt-5">
          <button
            type="submit"
            formAction={deleteArticle}
            formNoValidate
            onClick={(e) => {
              if (!window.confirm("이 글을 완전히 지울까요? 되돌릴 수 없어요.")) e.preventDefault();
              else clearDraft();
            }}
            className="btn btn-sm border-ruby bg-canvas text-ruby"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            글 삭제
          </button>
        </div>
      )}
    </form>
  );
}

function stripAt<T extends { at?: number }>(d: T): Omit<T, "at"> {
  const { at: _at, ...rest } = d;
  void _at;
  return rest;
}

function TabButton({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("btn btn-sm flex-1", on ? "btn-on-dark" : "btn-toggle")}>
      {icon}
      {children}
    </button>
  );
}
