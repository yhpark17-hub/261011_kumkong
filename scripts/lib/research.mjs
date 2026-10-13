/**
 * 리서치 결과 정규화·검증 (merge-research.mjs · apply-updates.mjs 공용)
 */

export const EVENT_TYPES = ["posting", "doc", "written", "interview1", "interview2", "final"];
export const STAGE_LABEL = {
  posting: "접수 시작",
  doc: "서류 마감",
  written: "필기",
  interview1: "1차 면접",
  interview2: "2차 면접",
  final: "최종 발표",
};
export const CONFIDENCE = new Set(["high", "medium", "low"]);

export const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
export const num = (v) =>
  typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && /^\d+(\.\d+)?$/.test(v) ? Number(v) : undefined;
export const strArr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
export const httpUrl = (v) => (str(v) && /^https?:\/\//i.test(v) ? v.trim() : undefined);

export function validDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d ?? "")) return false;
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === day && y >= 2024 && y <= 2027;
}

/** undefined 값 제거 (JSON 출력 정리) */
export function clean(obj) {
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

/** warn(id, msg) 로 문제를 기록하는 채용 정보 정규화기 */
export function createRecruitmentNormalizer({ warn, updatedAt }) {
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
      updatedAt,
      note: str(raw.note),
    };
  }

  return normalizeRecruitment;
}
