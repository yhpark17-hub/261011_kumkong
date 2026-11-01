// 사이트의 순수 모듈(데이터 import 없는 타입·날짜·일정 계산)을 앱으로 복사한다.
// 실행: mobile 폴더에서 `node scripts/sync-shared.mjs` — 사이트 쪽 파일을 고친 뒤 다시 돌린다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const from = join(here, "..", "..", "src", "lib");
const to = join(here, "..", "src", "shared");

const FILES = ["types.ts", "meta.ts", "schedule.ts", "date.ts", "format.ts", "catalog-client.ts"];
const allowed = new Set(FILES.map((f) => `./${f.replace(/\.ts$/, "")}`));

mkdirSync(to, { recursive: true });
for (const file of FILES) {
  const src = readFileSync(join(from, file), "utf8");
  // 목록 밖 파일을 import하면 앱에서 깨지므로 멈춘다
  for (const [, spec] of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    if (!allowed.has(spec)) throw new Error(`${file}: 복사할 수 없는 import "${spec}" — FILES에 더하거나 사이트 코드를 나눠 주세요`);
  }
  writeFileSync(join(to, file), `// 자동 복사본 — 사이트 src/lib/${file}에서 고친 뒤 scripts/sync-shared.mjs를 돌리세요.\n${src}`);
}
console.log(`복사했어요: ${FILES.join(", ")} → src/shared/`);
