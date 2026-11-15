#!/usr/bin/env node
/**
 * 금콩 하네스 검사 — Claude Code 훅이 부릅니다 (.claude/settings.json).
 *
 *   node scripts/hooks/guard.mjs pre-commit   git commit 직전 (PreToolUse). 실패하면 커밋을 막아요 (exit 2)
 *   node scripts/hooks/guard.mjs stop         작업을 끝내려 할 때 (Stop). 실패하면 한 번 더 고치게 해요 (exit 2)
 *   node scripts/hooks/guard.mjs              손으로 돌릴 때. 결과만 보여 줘요 (실패 시 exit 1)
 *
 * 검사 범위는 커밋 안 된 변경(스테이징·작업 중·새 파일)뿐이에요:
 *   - 사이트 코드·JSON 이 바뀌면  → 사이트 전체 타입 검사 (tsc --noEmit)
 *   - 바뀐 js/ts 파일              → 그 파일들만 eslint
 *   - mobile/ 의 ts/tsx 가 바뀌면  → 앱 타입 검사 (mobile 의 tsc)
 * 바뀐 코드가 없거나 검사 도구가 설치돼 있지 않으면 그냥 통과해요. 전체 검사는 `npm run check`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const mode = process.argv[2] ?? "manual";
const MAX_LINES = 60;

const CODE_EXT = /\.(tsx?|mts|cts|jsx?|mjs|cjs|json)$/;
const LINT_EXT = /\.(tsx?|jsx?|mjs|cjs)$/;
const SKIP_DIR = /^(node_modules|\.next|out|build|coverage)\//;

function hookInput() {
  if (mode === "manual") return {};
  try {
    return JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function git(args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) return null;
  return r.stdout.split("\0").filter(Boolean);
}

/** 커밋 안 된 변경 — HEAD 와 다른 추적 파일 + 무시되지 않은 새 파일 (지운 파일은 빼요) */
function changedFiles() {
  const tracked = git(["diff", "--name-only", "-z", "HEAD"]);
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"]);
  if (!tracked || !untracked) return null;
  return [...new Set([...tracked, ...untracked])]
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => !SKIP_DIR.test(f) && existsSync(path.join(ROOT, f)));
}

/** 코드 오류로 실패했는지 — 아니면 도구 자체가 죽은 것(설정·설치 문제)으로 봐요 */
const TSC_FAIL = (status, out) => status !== 0 && /error TS\d+/.test(out);
const ESLINT_FAIL = (status) => status === 1; // eslint: 1 = 규칙 위반, 2 = 설정·실행 오류

function run(label, bin, args, isFailure, cwd = ROOT) {
  if (!existsSync(bin)) return { label, skipped: `${path.relative(ROOT, bin)} 없음 (npm install 전?)` };
  const r = spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  if (r.status === 0) return { label, ok: true, out };
  return isFailure(r.status, out) ? { label, ok: false, out } : { label, ok: false, crashed: true, out };
}

function main() {
  const input = hookInput();

  if (mode === "pre-commit") {
    const cmd = String(input.tool_input?.command ?? "");
    // 훅의 if 조건이 걸러 주지만, PowerShell 쪽은 여기서 한 번 더 걸러요
    if (!/\bgit\b(?:\s+-[cC]\s+\S+)*\s+commit\b/.test(cmd)) return 0;
  }
  // Stop 훅이 이미 한 번 막아서 이어지는 중이면 다시 막지 않아요 (끝없이 도는 것 방지)
  if (mode === "stop" && input.stop_hook_active) return 0;

  const files = changedFiles();
  if (!files) return 0; // git 저장소가 아니거나 git 이 없으면 검사하지 않음

  const web = files.filter((f) => !f.startsWith("mobile/") && CODE_EXT.test(f));
  const lint = web.filter((f) => LINT_EXT.test(f));
  const app = files.filter((f) => f.startsWith("mobile/") && /\.tsx?$/.test(f));

  const results = [];
  if (web.length) {
    results.push(
      run("사이트 타입 검사 (tsc)", path.join(ROOT, "node_modules/typescript/bin/tsc"), ["--noEmit", "-p", "."], TSC_FAIL),
    );
  }
  if (lint.length) {
    results.push(
      run(
        "eslint (바뀐 파일)",
        path.join(ROOT, "node_modules/eslint/bin/eslint.js"),
        // 파일이 아주 많으면(명령줄 길이 한도) 프로젝트 전체를 검사해요
        lint.length > 150 ? [] : ["--no-warn-ignored", ...lint],
        ESLINT_FAIL,
      ),
    );
  }
  if (app.length) {
    const mobile = path.join(ROOT, "mobile");
    results.push(
      run(
        "앱 타입 검사 (mobile tsc)",
        path.join(mobile, "node_modules/typescript/bin/tsc"),
        ["--noEmit", "-p", "."],
        TSC_FAIL,
        mobile,
      ),
    );
  }

  const failed = results.filter((r) => r.ok === false && !r.crashed);
  const crashed = results.filter((r) => r.crashed);
  const skipped = results.filter((r) => r.skipped);

  if (mode === "manual") {
    if (!results.length) console.log("바뀐 코드 파일이 없어요 — 검사할 게 없어요.");
    for (const r of results) {
      if (r.skipped) console.log(`- ${r.label}: 건너뜀 (${r.skipped})`);
      else console.log(`- ${r.label}: ${r.ok ? "통과" : r.crashed ? "도구 오류" : "실패"}${r.ok ? "" : `\n${r.out}`}`);
    }
    return failed.length || crashed.length ? 1 : 0;
  }

  // 검사 도구가 없거나 스스로 죽은 경우(설정 문제)는 막지 않아요 — 작업과 상관없는 이유로 커밋이 멈추지 않게
  if (!failed.length) {
    for (const r of [...crashed, ...skipped]) {
      process.stderr.write(`[금콩 검사] ${r.label}: ${r.skipped ?? "도구가 제대로 돌지 않았어요"}\n`);
    }
    return 0;
  }

  const head =
    mode === "pre-commit"
      ? "[금콩 검사] 커밋 전에 검사에서 막혔어요. 아래 오류를 고친 뒤 다시 커밋하세요 (--no-verify 로 우회하지 마세요)."
      : "[금콩 검사] 커밋 안 된 변경에서 오류가 나왔어요. 고친 뒤 끝내세요. 일부러 남긴 미완성이면 그 이유를 운영자에게 말하세요.";
  const body = failed
    .map((r) => {
      const lines = r.out.split(/\r?\n/);
      const cut = lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES), `… (${lines.length - MAX_LINES}줄 더)`] : lines;
      return `■ ${r.label}\n${cut.join("\n")}`;
    })
    .join("\n\n");
  process.stderr.write(`${head}\n\n${body}\n`);
  return 2;
}

process.exit(main());
