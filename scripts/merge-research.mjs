/**
 * 리서치 결과(JSON) → src/data/generated/{companies,recruitments}.json 병합
 *
 *   node scripts/merge-research.mjs <research1.json> <research2.json> ...
 *
 * 자동 검증:
 *  - 날짜 형식·실존 날짜, 기간(endDate ≥ date), 시각 형식
 *  - 전형 순서(접수 → 서류 마감 → 필기 → 1차 → 2차 → 발표) 역전 여부
 *  - 같은 단계가 라벨 없이 여러 번 나오는 경우 (중복 기재 의심)
 *  - 경쟁률 = 지원자 / 채용인원 재계산 (불일치 시 재계산 값 사용)
 *  - 직접 정리한 기관(src/data/companies.ts)과 id 가 겹치면 제외
 * 문제는 콘솔과 --report 경로에 기록하고, 사람이 확인한 뒤 반영합니다.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = join(ROOT, "src", "data", "generated");
const UPDATED_AT = "2026-10-11";

const CATEGORIES = new Set(["finance", "fininfra", "public", "mutual", "assoc", "bank", "insurance", "capital"]);
const BLIND = new Set(["full", "partial", "none", "unknown"]);
const MAJOR = new Set(["none", "integrated", "single", "unknown"]);
const EVENT_TYPES = ["posting", "doc", "written", "interview1", "interview2", "final"];
const STAGE_LABEL = {
  posting: "접수 시작",
  doc: "서류 마감",
  written: "필기",
  interview1: "1차 면접",
  interview2: "2차 면접",
  final: "최종 발표",
};
const SOURCES = new Set(["ALIO", "언론보도", "기관발표"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);

/** 사람이 검토해 제외한 채용 정보 (기관 정보는 유지) — id: 사유 */
const EXCLUDED_RECRUITMENTS = {
  nfcf: "산림경영지도원 자격전형 — 사무직 신입 공채가 아님",
};

const args = process.argv.slice(2);
const reportIdx = args.indexOf("--report");
const reportPath = reportIdx >= 0 ? args[reportIdx + 1] : null;
const inputs = args.filter((a, i) => !a.startsWith("--") && i !== reportIdx + 1);

const issues = [];
const warn = (id, msg) => issues.push(`[${id}] ${msg}`);

const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && /^\d+(\.\d+)?$/.test(v) ? Number(v) : undefined);
const strArr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const httpUrl = (v) => (str(v) && /^https?:\/\//i.test(v) ? v.trim() : undefined);

function validDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d ?? "")) return false;
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day && y >= 2024 && y <= 2027;
}

/** undefined 값 제거 (JSON 출력 정리) */
function clean(obj) {
  if (Array.isArray(obj)) return obj.map(clean);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clean(v)]),
    );
  }
  return obj;
}

function normalizeCompany(raw, id) {
  const category = CATEGORIES.has(raw.category) ? raw.category : null;
  if (!category) warn(id, `잘못된 category: ${raw.category}`);
  const w = raw.written ?? {};
  const stats = (Array.isArray(raw.stats) ? raw.stats : [])
    .map((s) => {
      const applicants = num(s.applicants);
      const hires = num(s.hires);
      let ratio = num(s.ratio);
      if (applicants && hires) {
        const computed = Math.round((applicants / hires) * 10) / 10;
        if (ratio == null || Math.abs(computed - ratio) > 0.15) {
          if (ratio != null) warn(id, `경쟁률 불일치 ${s.label ?? s.year}: 기재 ${ratio} → 재계산 ${computed}`);
          ratio = computed;
        }
      } else if (ratio != null && !hires) {
        ratio = undefined;
      }
      return {
        year: num(s.year),
        label: str(s.label),
        applicants,
        hires,
        ratio,
        source: SOURCES.has(s.source) ? s.source : "ALIO",
      };
    })
    .filter((s) => s.year && (s.applicants != null || s.ratio != null));

  return {
    id,
    name: str(raw.name),
    shortName: str(raw.shortName) ?? str(raw.name),
    category: category ?? "public",
    hq: str(raw.hq),
    description: str(raw.description) ?? "",
    homepage: httpUrl(raw.homepage),
    recruitUrl: httpUrl(raw.recruitUrl),
    alioListed: typeof raw.alioListed === "boolean" ? raw.alioListed : undefined,
    blind: BLIND.has(raw.blind) ? raw.blind : "unknown",
    written: {
      ncs: {
        has: typeof w.ncs?.has === "boolean" ? w.ncs.has : null,
        type: str(w.ncs?.type),
        subjects: strArr(w.ncs?.subjects),
        questions: num(w.ncs?.questions),
        minutes: num(w.ncs?.minutes),
      },
      major: {
        type: MAJOR.has(w.major?.type) ? w.major.type : "unknown",
        subjects: str(w.major?.subjects),
        minutes: num(w.major?.minutes),
      },
      extra: strArr(w.extra).length ? strArr(w.extra) : undefined,
      note: str(w.note),
    },
    stats,
  };
}

function normalizeRecruitment(raw, id, verification) {
  const events = [];
  for (const e of Array.isArray(raw.events) ? raw.events : []) {
    if (!EVENT_TYPES.includes(e?.type)) {
      warn(id, `알 수 없는 일정 유형: ${e?.type}`);
      continue;
    }
    if (!validDate(e.date)) {
      warn(id, `잘못된 날짜 ${e.type}: ${e.date}`);
      continue;
    }
    let endDate = e.endDate && e.endDate !== e.date ? e.endDate : undefined;
    if (endDate && (!validDate(endDate) || endDate < e.date)) {
      warn(id, `잘못된 종료일 ${e.type}: ${e.date}~${e.endDate} → 종료일 제거`);
      endDate = undefined;
    }
    // "24:00" 마감은 당일 23:59 로 표기
    const rawTime = str(e.time) === "24:00" ? "23:59" : str(e.time);
    const time = rawTime && /^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime) ? rawTime : undefined;
    if (str(e.time) && !time) warn(id, `잘못된 시각 ${e.type}: ${e.time}`);
    // 라벨에 단계명이 없으면 앞에 붙임 (예: "전산직" → "1차 면접 · 전산직")
    let label = str(e.label);
    if (label && !/필기|면접|마감|접수|발표|시험|검사|평가/.test(label)) label = `${STAGE_LABEL[e.type]} · ${label}`;
    events.push({ type: e.type, date: e.date, endDate, time, label, note: str(e.note) });
  }

  // 같은 단계·같은 날짜 중복 제거, 라벨 없는 다회차는 경고
  const seen = new Map();
  const deduped = [];
  for (const e of events) {
    const key = `${e.type}|${e.date}`;
    if (seen.has(key)) {
      warn(id, `중복 일정 제거: ${key}`);
      continue;
    }
    seen.set(key, e);
    deduped.push(e);
  }
  for (const type of EVENT_TYPES) {
    const same = deduped.filter((e) => e.type === type);
    if (same.length > 1 && same.some((e) => !e.label)) {
      warn(id, `같은 단계(${type})가 ${same.length}번, 라벨 없음 — 중복 기재인지 확인 필요: ${same.map((e) => e.date).join(", ")}`);
    }
  }
  // 전형 순서 역전 검사 (각 단계의 첫 날짜 기준)
  const firstOf = (t) => deduped.filter((e) => e.type === t).map((e) => e.date).sort()[0];
  let prev = null;
  for (const t of EVENT_TYPES) {
    const d = firstOf(t);
    if (!d) continue;
    if (prev && d < prev.date) warn(id, `전형 순서 역전: ${prev.type}(${prev.date}) 이후인 ${t}가 ${d}`);
    prev = { type: t, date: d };
  }

  return {
    companyId: id,
    title: str(raw.title) ?? "신입 채용",
    period: str(raw.period) ?? "",
    status: "confirmed",
    headcount: num(raw.headcount),
    tracks: strArr(raw.tracks),
    events: deduped.sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? -1 : 1) : EVENT_TYPES.indexOf(a.type) - EVENT_TYPES.indexOf(b.type),
    ),
    essayQuestions: (Array.isArray(raw.essayQuestions) ? raw.essayQuestions : [])
      .map((q) => ({ q: str(q?.q), limit: num(q?.limit), unit: q?.unit === "byte" ? "byte" : undefined }))
      .filter((q) => q.q),
    essayRef: str(raw.essayRef),
    postingUrl: httpUrl(raw.postingUrl),
    sourceUrl: httpUrl(verification?.primarySource),
    confidence: CONFIDENCE.has(verification?.confidence) ? verification.confidence : undefined,
    updatedAt: UPDATED_AT,
    note: str(raw.note),
  };
}

async function main() {
  if (!inputs.length) {
    console.error("사용법: node scripts/merge-research.mjs <research.json...> [--report out.txt]");
    process.exit(1);
  }
  const curated = await readFile(join(ROOT, "src", "data", "companies.ts"), "utf8");
  const curatedIds = new Set([...curated.matchAll(/\bid:\s*"([^"]+)"/g)].map((m) => m[1]));

  const companies = new Map();
  const recruitments = new Map();
  for (const path of inputs) {
    if (!existsSync(path)) {
      console.warn(`파일 없음: ${path}`);
      continue;
    }
    const items = JSON.parse(await readFile(path, "utf8"));
    for (const item of items) {
      const id = str(item?.company?.id);
      if (!id) continue;
      if (curatedIds.has(id)) {
        warn(id, "직접 정리한 데이터와 id 중복 — 제외");
        continue;
      }
      const company = normalizeCompany(item.company, id);
      if (!company.name) {
        warn(id, "기관명 없음 — 제외");
        continue;
      }
      companies.set(id, company);
      if (EXCLUDED_RECRUITMENTS[id]) {
        warn(id, `채용 정보 제외: ${EXCLUDED_RECRUITMENTS[id]}`);
      } else if (item.recruitment) {
        const r = normalizeRecruitment(item.recruitment, id, item.verification);
        recruitments.set(id, r);
        if (!r.events.length) warn(id, "확정 일정 없음");
      } else {
        warn(id, "채용 정보 없음 (기관 정보만 추가)");
      }
      const unverified = item.verification?.unverified;
      if (Array.isArray(unverified) && unverified.length) warn(id, `2차 출처만 확인: ${unverified.join(", ")}`);
      if (str(item.verification?.conflicts)) warn(id, `출처 충돌: ${item.verification.conflicts}`);
    }
  }

  await writeFile(join(OUT_DIR, "companies.json"), `${JSON.stringify(clean([...companies.values()]), null, 2)}\n`);
  await writeFile(join(OUT_DIR, "recruitments.json"), `${JSON.stringify(clean([...recruitments.values()]), null, 2)}\n`);
  console.log(`기관 ${companies.size}곳, 채용 ${recruitments.size}건 병합`);
  console.log(`확인 필요 항목 ${issues.length}건`);
  if (reportPath) await writeFile(reportPath, `${issues.join("\n")}\n`);
  else issues.forEach((i) => console.log(i));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
