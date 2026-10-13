import "server-only";
import type { Recruitment } from "../types";

/**
 * 승인한 일정 수정을 GitHub 저장소에 바로 커밋 (→ Vercel 이 자동으로 다시 배포)
 * 필요한 환경 변수: GITHUB_TOKEN (이 저장소만 Contents 읽기·쓰기 권한의 fine-grained 토큰)
 * 선택: GITHUB_REPO (owner/repo — 없으면 Vercel 이 알려 주는 저장소), GITHUB_BRANCH (기본 main)
 */

const FILE = "src/data/generated/recruitment-updates.json";

export function githubConfig(): { token: string; repo: string; branch: string } | null {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo =
    process.env.GITHUB_REPO?.trim() ||
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}`
      : "");
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return { token, repo, branch: process.env.GITHUB_BRANCH?.trim() || "main" };
}

async function gh(path: string, init: RequestInit & { token: string }) {
  const { token, ...rest } = init;
  return fetch(`https://api.github.com${path}`, {
    ...rest,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
    },
    cache: "no-store",
  });
}

/** 기관별 레코드를 넣거나 바꿔서 커밋. 충돌(동시에 다른 커밋)이 나면 한 번 다시 시도 */
export async function upsertRecruitmentRecords(records: Recruitment[], message: string): Promise<{ commitUrl: string | null }> {
  const cfg = githubConfig();
  if (!cfg) throw new Error("GITHUB_TOKEN 이 설정되지 않았어요");
  const path = `/repos/${cfg.repo}/contents/${FILE}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const cur = await gh(`${path}?ref=${encodeURIComponent(cfg.branch)}`, { token: cfg.token });
    if (!cur.ok) throw new Error(`GitHub 파일을 읽지 못했어요 (${cur.status})`);
    const meta = (await cur.json()) as { sha: string; content: string; encoding: string };
    const list = JSON.parse(Buffer.from(meta.content, "base64").toString("utf8")) as Recruitment[];
    const map = new Map(list.map((r) => [r.companyId, r]));
    for (const r of records) map.set(r.companyId, r);
    const next = [...map.values()].sort((a, b) => (a.companyId < b.companyId ? -1 : 1));
    const body = `${JSON.stringify(next, null, 2)}\n`;

    const put = await gh(path, {
      token: cfg.token,
      method: "PUT",
      body: JSON.stringify({
        message,
        content: Buffer.from(body, "utf8").toString("base64"),
        sha: meta.sha,
        branch: cfg.branch,
      }),
    });
    if (put.ok) {
      const res = (await put.json()) as { commit?: { html_url?: string } };
      return { commitUrl: res.commit?.html_url ?? null };
    }
    if (put.status !== 409 && put.status !== 422) throw new Error(`GitHub 커밋 실패 (${put.status})`);
  }
  throw new Error("GitHub 커밋이 충돌했어요. 잠시 뒤 다시 시도해 주세요.");
}
