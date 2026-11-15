#!/usr/bin/env node
/**
 * 점심 3문제 블라인드 검증용 문제 파일 만들기 — 정답·해설·근거를 뺍니다.
 *
 *   node scripts/automation/blind-drill.mjs /tmp/kk/briefing.json /tmp/kk/today.json > /tmp/kk/drill-blind.json
 *
 *   briefing.json : 올리려는 점심판 초안 (drill.questions 가 있는 것)
 *   today.json    : `node scripts/automation/api.mjs today` 로 받은 오늘 아침판 기사
 *
 * 나온 파일은 quiz-solver 에이전트에게만 넘깁니다 (.claude/agents/quiz-solver.md).
 * 손으로 옮기지 않고 이 스크립트로 뽑는 건, 옮기다 숫자·보기가 바뀌거나 정답이 새는 걸 막으려는 거예요.
 */
import { readFileSync } from "node:fs";

const [draftPath, todayPath] = process.argv.slice(2);
if (!draftPath) {
  console.error("사용법: node scripts/automation/blind-drill.mjs <briefing.json> [today.json]");
  process.exit(1);
}

const draft = JSON.parse(readFileSync(draftPath, "utf8"));
const today = todayPath ? JSON.parse(readFileSync(todayPath, "utf8")) : { items: [] };

const questions = draft?.drill?.questions;
if (!Array.isArray(questions) || !questions.length) {
  console.error("drill.questions 가 없어요 — 점심판 초안 파일이 맞나요?");
  process.exit(1);
}

/** 카드에서 그림 칸만 빼고 글은 그대로 (독자가 아침에 본 그대로) */
function stripCard(card) {
  if (!card || typeof card !== "object") return card;
  const rest = { ...card };
  delete rest.pic;
  return rest;
}

const articles = (today.items ?? []).map((n) => ({
  id: n.id,
  title: n.title,
  takeaway: n.takeaway,
  summary: n.summary,
  point: n.point,
  cards: Array.isArray(n.cards) ? n.cards.map(stripCard) : [],
}));

const blind = {
  articles,
  questions: questions.map((q, i) => ({
    no: i + 1,
    kind: q.kind,
    subject: q.subject,
    stem: q.stem,
    options: q.options,
  })),
};

// 혹시라도 정답 관련 칸이 섞여 나가지 않았는지 마지막으로 확인
const leaked = JSON.stringify(blind.questions).match(/"(answer|explain|basis)"/);
if (leaked) {
  console.error(`정답 관련 칸(${leaked[1]})이 섞였어요 — 파일을 만들지 않았어요`);
  process.exit(1);
}
if (!articles.length) console.error("주의: 아침판 기사가 비어 있어요 (today.json 을 넘겼나요?)");

process.stdout.write(`${JSON.stringify(blind, null, 2)}\n`);
