/**
 * 운영자가 승인한 일정 수정(아직 저장소에 없는 것)을 recruitment-updates.json 에 반영
 *
 *   node scripts/automation/apply-approved.mjs inbox.json
 *
 * inbox.json 은 `api.mjs inbox` 출력. approvedToApply[].record 를 기관별로 덮어씁니다.
 * 반영한 제안 id 목록을 applied-ids.json 으로 남깁니다 (→ api.mjs applied applied-ids.json).
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const OUT = join(ROOT, "src", "data", "generated", "recruitment-updates.json");

const input = process.argv[2];
if (!input) {
  console.error("사용법: node scripts/automation/apply-approved.mjs inbox.json");
  process.exit(2);
}
const inbox = JSON.parse(await readFile(input, "utf8"));
const approved = (inbox.approvedToApply ?? []).filter((p) => p.record && typeof p.record.companyId === "string");
if (!approved.length) {
  console.log("반영할 승인 건이 없어요");
  await writeFile(join(process.cwd(), "applied-ids.json"), JSON.stringify({ ids: [] }));
  process.exit(0);
}

const list = JSON.parse(await readFile(OUT, "utf8"));
const map = new Map(list.map((r) => [r.companyId, r]));
for (const p of approved) map.set(p.record.companyId, p.record);
const next = [...map.values()].sort((a, b) => (a.companyId < b.companyId ? -1 : 1));
await writeFile(OUT, `${JSON.stringify(next, null, 2)}\n`);
const ids = approved.map((p) => p.id);
await writeFile(join(process.cwd(), "applied-ids.json"), JSON.stringify({ ids, note: "자동 점검이 저장소에 커밋" }));
console.log(`승인 건 ${ids.length}개 반영: ${approved.map((p) => `#${p.id} ${p.record.companyId}`).join(", ")}`);
