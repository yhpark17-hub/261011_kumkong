/**
 * 기관별 최신 채용 일정 업데이트 → src/data/generated/recruitment-updates.json
 *
 *   node scripts/apply-updates.mjs <update1.json> <update2.json> ... [--report out.txt] [--date 2026-10-13] [--preview records.json]
 *
 * --preview: 파일은 그대로 두고, 반영될 기관별 최종 레코드만 records.json 에 씁니다
 *            (자동 점검 에이전트가 운영자 승인용 제안을 만들 때 사용 — scripts/automation/ROUTINE.md)
 *
 * 입력 형식: [{ id, found, isNewCycle, recruitment, verification, changes, notFoundReason }]
 * - recruitment.events 가 있는 기관만 반영합니다 (found=false 라도 최근 회차를 출처로 보완했다면 반영).
 *   일정(events)은 새로 확인한 목록으로 통째로 바꾸고,
 *   직렬·인원·자소서 문항은 새 값이 없으면 기존 값을 유지합니다
 *   (새 채용 회차면 지난 회차 자소서는 '직전 공고 참고'로 표시).
 * - 직접 정리한 기관(src/data/recruitments.ts)과 리서치 병합 기관(generated) 모두에 적용되며,
 *   화면에는 이 파일의 값이 우선합니다 (src/lib/data.ts).
 * - 검증 규칙은 merge-research.mjs 와 같습니다 (scripts/lib/research.mjs).
 *   기존 일정이 사라지는 경우·출처 충돌 등은 --report 파일에 남기니 사람이 확인하세요.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { clean, createRecruitmentNormalizer, str } from "./lib/research.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "src", "data", "generated", "recruitment-updates.json");

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const reportPath = opt("--report");
const previewPath = opt("--preview");
const date = opt("--date") ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const optionValues = new Set([reportPath, opt("--date"), previewPath]);
const inputs = args.filter((a) => !a.startsWith("--") && !optionValues.has(a));

const issues = [];
const lines = [];
const warn = (id, msg) => issues.push(`[${id}] ${msg}`);
const normalize = createRecruitmentNormalizer({ warn, updatedAt: date });

const eventKey = (e) => `${e.type}|${e.date}|${e.time ?? ""}|${e.label ?? ""}`;
const describe = (e) => `${e.type} ${e.date}${e.endDate ? `~${e.endDate}` : ""}${e.time ? ` ${e.time}` : ""}${e.label ? ` (${e.label})` : ""}`;

async function main() {
  if (!inputs.length) {
    console.error("사용법: node scripts/apply-updates.mjs <update.json...> [--report out.txt] [--date YYYY-MM-DD]");
    process.exit(1);
  }

  // 현재 화면 데이터 = 기존 업데이트 > 직접 정리 > 리서치 병합
  const curated = await import(pathToFileURL(join(ROOT, "src", "data", "recruitments.ts")).href);
  const generated = JSON.parse(await readFile(join(ROOT, "src", "data", "generated", "recruitments.json"), "utf8"));
  const previous = existsSync(OUT) ? JSON.parse(await readFile(OUT, "utf8")) : [];
  const companyIds = new Set([
    ...[...(await readFile(join(ROOT, "src", "data", "companies.ts"), "utf8")).matchAll(/\bid:\s*"([^"]+)"/g)].map((m) => m[1]),
    ...JSON.parse(await readFile(join(ROOT, "src", "data", "generated", "companies.json"), "utf8")).map((c) => c.id),
  ]);
  const base = new Map([...generated, ...curated.RECRUITMENTS].map((r) => [r.companyId, r]));
  const updates = new Map(previous.map((r) => [r.companyId, r]));

  let applied = 0;
  let skipped = 0;
  const touched = new Set();
  for (const path of inputs) {
    if (!existsSync(path)) {
      console.warn(`파일 없음: ${path}`);
      continue;
    }
    for (const item of JSON.parse(await readFile(path, "utf8"))) {
      const id = str(item?.id);
      if (!id) continue;
      if (!companyIds.has(id)) {
        warn(id, "기관 목록에 없는 id — 제외");
        continue;
      }
      // found=false 여도 '가장 최근 실제 회차'를 출처로 보완해 왔다면 반영합니다
      if (!item.recruitment || !Array.isArray(item.recruitment.events) || !item.recruitment.events.length) {
        skipped++;
        lines.push(`- ${id}: 변경 없음 (${str(item.notFoundReason) ?? "최신 공고 미확인"})`);
        continue;
      }
      if (!item.found) lines.push(`- ${id}: 새 공고 없음 — ${str(item.notFoundReason) ?? "최신 공고 미확인"} (기존 회차 보완분만 반영)`);
      const before = updates.get(id) ?? base.get(id);
      const next = normalize(item.recruitment, id, item.verification);
      if (!next.events.length) {
        warn(id, "확인된 일정이 없어 반영하지 않음");
        skipped++;
        continue;
      }
      const newCycle = Boolean(item.isNewCycle) || !before;
      const keep = (field, empty) => (newCycle ? empty : (before?.[field] ?? empty));
      const merged = {
        ...(newCycle ? {} : before),
        companyId: id,
        title: next.title !== "신입 채용" ? next.title : (before?.title ?? next.title),
        period: next.period || keep("period", ""),
        status: "confirmed",
        headcount: next.headcount ?? keep("headcount", undefined),
        tracks: next.tracks.length ? next.tracks : keep("tracks", []),
        events: next.events,
        essayQuestions: next.essayQuestions.length ? next.essayQuestions : (before?.essayQuestions ?? []),
        essayRef:
          next.essayRef ??
          (newCycle && !next.essayQuestions.length && before?.essayQuestions?.length
            ? (before.essayRef ?? "직전 공고 기준 (참고)")
            : before?.essayRef),
        postingUrl: next.postingUrl ?? keep("postingUrl", undefined),
        sourceUrl: next.sourceUrl ?? before?.sourceUrl,
        confidence: next.confidence ?? before?.confidence,
        updatedAt: date,
        note: next.note ?? keep("note", undefined),
      };
      updates.set(id, merged);
      touched.add(id);
      applied++;

      // 사람이 확인할 수 있게 바뀐 일정을 남김
      // 추가·변경은 라벨·시각까지, 삭제는 '그 단계의 그 날짜가 사라졌는지'로 판단
      const dayKey = (e) => `${e.type}|${e.date}`;
      const oldKeys = new Set((before?.events ?? []).map(eventKey));
      const newDays = new Set(next.events.map(dayKey));
      const added = next.events.filter((e) => !oldKeys.has(eventKey(e))).map(describe);
      const removed = (before?.events ?? []).filter((e) => !newDays.has(dayKey(e))).map(describe);
      if (removed.length && !newCycle) warn(id, `기존 일정이 빠짐 — 확인 필요: ${removed.join(", ")}`);
      lines.push(
        `- ${id}${newCycle ? " [새 회차]" : ""} (${merged.confidence ?? "?"}): ` +
          [added.length ? `+ ${added.join(", ")}` : "", removed.length ? `- ${removed.join(", ")}` : ""].filter(Boolean).join(" / "),
      );
      for (const c of Array.isArray(item.changes) ? item.changes : []) if (str(c)) lines.push(`    · ${str(c)}`);
      const unverified = item.verification?.unverified;
      if (Array.isArray(unverified) && unverified.length) warn(id, `미확인: ${unverified.join(", ")}`);
      if (str(item.verification?.conflicts)) warn(id, `출처 충돌: ${item.verification.conflicts}`);
    }
  }

  if (previewPath) {
    const records = clean([...touched].map((id) => updates.get(id)));
    await writeFile(previewPath, `${JSON.stringify(records, null, 2)}\n`);
    console.log(`미리보기: ${records.length}곳 레코드를 ${previewPath} 에 썼어요 (업데이트 파일은 그대로)`);
  }
  const out = clean([...updates.values()].sort((a, b) => (a.companyId < b.companyId ? -1 : 1)));
  if (!previewPath) await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`);
  const summary = `반영 ${applied}곳, 변경 없음 ${skipped}곳, 업데이트 파일 총 ${out.length}곳 (기준일 ${date})`;
  console.log(summary);
  console.log(`확인 필요 항목 ${issues.length}건`);
  if (reportPath) {
    await writeFile(reportPath, [summary, "", "## 변경 내역", ...lines, "", "## 확인 필요", ...issues, ""].join("\n"));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
