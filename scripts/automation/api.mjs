/**
 * 자동 점검 에이전트용 사이트 API 호출 도구
 *
 *   node scripts/automation/api.mjs inbox                      → 할 일 목록 JSON 출력
 *   node scripts/automation/api.mjs proposals <payload.json>    → 제안 올리기
 *   node scripts/automation/api.mjs issue <briefing.json>        → 데일리 브리핑 초안 한 호(아침판 또는 점심판) 올리기
 *   node scripts/automation/api.mjs today                      → 오늘 아침판 기사 보기 (점심판 만들 때)
 *   node scripts/automation/api.mjs articles <draft.json>       → 금융 블로그 자동 초안 올리기
 *   node scripts/automation/api.mjs applied <ids.json>          → 승인 건을 저장소에 반영했다고 알리기
 *
 * 환경 변수
 *   KUMKONG_SITE_URL  사이트 주소 (예: https://kumkong.vercel.app)
 *   AUTOMATION_TOKEN  Vercel 에 넣은 값과 같은 토큰. 네트워크 시크릿으로 프록시가 붙여 주는 경우엔 없어도 됨
 * 토큰 값은 절대 출력하지 않습니다.
 */
import { readFile } from "node:fs/promises";

const [cmd, file] = process.argv.slice(2);
const base = (process.env.KUMKONG_SITE_URL ?? "").replace(/\/+$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("KUMKONG_SITE_URL 환경 변수가 필요해요 (예: https://kumkong.vercel.app)");
  process.exit(2);
}
const token = process.env.AUTOMATION_TOKEN?.trim();
const headers = { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) };

const routes = { inbox: ["GET", "/api/automation/inbox"], proposals: ["POST", "/api/automation/proposals"], articles: ["POST", "/api/automation/articles"], issue: ["POST", "/api/automation/issue"], today: ["GET", "/api/automation/issue"], applied: ["POST", "/api/automation/applied"] };
const route = routes[cmd];
if (!route) {
  console.error(`사용법: node scripts/automation/api.mjs <${Object.keys(routes).join("|")}> [file.json]`);
  process.exit(2);
}
const [method, path] = route;
let body;
if (method === "POST") {
  if (!file) {
    console.error("보낼 JSON 파일 경로가 필요해요");
    process.exit(2);
  }
  body = await readFile(file, "utf8");
  JSON.parse(body); // 형식 확인
}

const res = await fetch(`${base}${path}`, { method, headers, body });
const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status} ${res.headers.get("x-deny-reason") ?? ""}`.trim());
  console.error(text.slice(0, 2000));
  process.exit(1);
}
process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
