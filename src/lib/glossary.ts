/**
 * 생초보 용어 풀이 — 카드뉴스 글에 이 말이 나오면 카드 아래에 각주(¹ ²)로 짧게 풀어 줘요.
 * 금융을 처음 공부하는 사람 기준으로, 숫자 없이 뜻만 (기사마다 더 필요한 말은 자동 점검이 notes 로 붙여요).
 * match 가 있으면 그 말들도 같은 풀이로 묶어요. 긴 말부터 찾으니 '홍콩 ELS'가 'ELS'보다 먼저 잡혀요.
 */
export interface GlossaryEntry {
  term: string;
  text: string;
  match?: string[];
}

export const GLOSSARY: GlossaryEntry[] = [
  // 기관·회의
  { term: "금융위원회", match: ["금융위"], text: "금융 정책을 만들고 금융회사 허가·제재를 최종 결정하는 정부 기관이에요." },
  { term: "금융감독원", match: ["금감원"], text: "은행·보험·증권사가 규칙을 잘 지키는지 검사하고 감독하는 기관이에요." },
  { term: "한국은행", match: ["한은"], text: "우리나라 중앙은행이에요. 기준금리를 정하고 물가를 관리해요." },
  { term: "금융통화위원회", match: ["금통위"], text: "한국은행에서 기준금리를 정하는 회의예요." },
  { term: "예금보험공사", match: ["예보"], text: "금융회사가 문을 닫아도 예금자가 돈을 돌려받게 예금을 보호하는 공공기관이에요." },
  { term: "한국수출입은행", match: ["수출입은행"], text: "수출과 해외 진출을 돈으로 돕는 정책금융기관이에요." },
  { term: "한국산업은행", match: ["산업은행"], text: "기업과 산업에 장기 자금을 대 주는 정책금융기관이에요." },
  { term: "정책금융기관", text: "정부 정책에 맞춰 특정 산업·기업에 돈을 빌려주거나 보증하는 금융기관이에요." },
  { term: "공공기관운영위원회", match: ["공운위"], text: "어떤 기관을 공공기관으로 정할지, 어떻게 운영할지 심의하는 정부 위원회예요." },
  { term: "국가데이터처", text: "우리나라 공식 통계를 만드는 정부 기관이에요 (옛 통계청)." },
  { term: "IMF", match: ["국제통화기금"], text: "세계 경제와 환율 안정을 위해 만든 국제기구예요. 나라별 경제 전망도 내요." },
  { term: "연준", match: ["연방준비제도"], text: "미국의 중앙은행이에요. 미국 기준금리를 정해요." },
  { term: "FOMC", text: "미국 중앙은행(연준)이 기준금리를 정하는 회의예요." },
  // 감독·제도
  { term: "기준금리", text: "중앙은행이 정하는 기본 금리예요. 대출·예금 금리가 이를 따라 움직여요." },
  { term: "제재", text: "규칙을 어긴 금융회사나 직원에게 내리는 벌이에요 (경고·과징금·영업정지 등)." },
  { term: "과징금", text: "법을 어긴 회사에 정부가 물리는, 돈으로 내는 벌이에요." },
  { term: "인허가", text: "새 사업을 하려면 정부·당국에게 받아야 하는 허락이에요." },
  { term: "전결", text: "윗선에 올리지 않고 그 자리에서 최종 결정하는 것이에요." },
  { term: "공공기관 지정", text: "정부가 어떤 기관을 공공기관으로 정해 경영 평가·감독을 받게 하는 것이에요." },
  { term: "홍콩 ELS", match: ["홍콩ELS"], text: "은행이 판 홍콩 주가지수 연계 ELS에서 큰 손실이 나, 불완전판매가 문제 된 사건이에요." },
  { term: "ELS", match: ["주가연계증권"], text: "주가지수가 조건을 지키면 약속한 수익을 주고, 크게 떨어지면 손실이 날 수 있는 투자상품이에요." },
  { term: "불완전판매", text: "상품의 위험을 제대로 설명하지 않고 판매하는 것이에요." },
  { term: "예보료율", text: "예금 같은 보호 대상 금액에 곱해 예보료를 정하는 비율이에요." },
  { term: "예보료", match: ["예금보험료"], text: "금융회사가 예금 보호를 위해 예금보험공사에 내는 보험료예요." },
  { term: "예금보호한도", text: "금융회사가 문을 닫았을 때 대신 돌려받을 수 있는 예금의 최대 금액이에요." },
  { term: "예보채상환기금", text: "외환위기 때 금융회사를 살리려 쓴 돈을 갚기 위해 만든 기금이에요." },
  { term: "특별기여금", text: "그 빚을 갚으려고 금융회사가 예보료와 별도로 더 내는 돈이에요." },
  { term: "연구용역", text: "정부가 정책을 만들기 전에 외부 전문가에게 맡기는 조사·연구예요." },
  { term: "TF", match: ["태스크포스"], text: "특정 문제를 풀려고 임시로 꾸린 팀이에요." },
  { term: "민관 합동", text: "정부(관)와 민간이 함께한다는 뜻이에요." },
  { term: "업권", text: "은행·보험·증권처럼 같은 종류의 금융회사 묶음이에요." },
  { term: "생명보험", text: "사망·질병처럼 사람에게 생기는 일에 대비하는 보험이에요." },
  { term: "손해보험", text: "자동차 사고·화재처럼 재산 피해에 대비하는 보험이에요." },
  // 대출·예금·금리
  { term: "가계대출", text: "개인(가계)이 은행 등에서 빌린 돈이에요." },
  { term: "주택담보대출", match: ["주담대"], text: "집을 담보로 맡기고 받는 대출이에요." },
  { term: "신용대출", text: "담보 없이 소득·신용점수만 보고 받는 대출이에요." },
  { term: "마이너스통장", text: "정해진 한도 안에서 필요할 때 꺼내 쓰는 대출 통장이에요." },
  { term: "빚투", text: "빚을 내서 주식 등에 투자하는 것을 줄인 말이에요." },
  { term: "정기예금", text: "정해진 기간 돈을 맡기고 약속한 이자를 받는 예금이에요." },
  { term: "변동금리", text: "대출 기간 중 시장 금리에 따라 이자율이 바뀌는 방식이에요." },
  { term: "고정금리", text: "정해진 기간 동안 이자율이 바뀌지 않는 방식이에요." },
  { term: "코픽스", match: ["COFIX"], text: "은행들이 돈을 모으는 데 든 평균 금리예요. 변동금리 대출 이자의 기준이 돼요." },
  { term: "은행채", text: "은행이 돈을 빌리려고 발행하는 채권이에요. 고정금리 대출 이자의 기준이 돼요." },
  { term: "채권", text: "돈을 빌리면서 이자와 갚을 날짜를 약속한 증서예요." },
  { term: "국채", text: "정부가 돈을 빌리려고 발행하는 채권이에요." },
  { term: "회사채", text: "기업이 돈을 빌리려고 발행하는 채권이에요." },
  { term: "엔화채", match: ["엔화 표시 채권"], text: "엔화로 돈을 빌리려고 발행하는 채권이에요." },
  { term: "신용스프레드", text: "회사채와 국채의 금리 차이예요. 벌어지면 기업이 돈 빌리기 어려워졌다는 뜻이에요." },
  { term: "bp", match: ["베이시스포인트"], text: "금리를 재는 작은 단위예요. 100bp가 1%포인트예요." },
  // 경제 지표
  { term: "경상흑자", text: "해외와 거래해 번 돈이 쓴 돈보다 많은 상태예요." },
  { term: "흑자", text: "들어온 돈이 나간 돈보다 많은 상태예요. 반대는 적자예요." },
  { term: "적자", text: "나간 돈이 들어온 돈보다 많은 상태예요." },
  { term: "경상수지", text: "해외와 물건·서비스를 사고팔고 이자·배당을 주고받은 결과예요." },
  { term: "GDP", match: ["국내총생산"], text: "한 나라에서 일정 기간 새로 만든 상품·서비스의 가치를 모두 더한 것이에요." },
  { term: "내수", text: "나라 안에서 쓰는 소비와 투자예요." },
  { term: "근원물가", text: "값이 크게 출렁이는 식료품·에너지를 빼고 본 물가예요." },
  { term: "임시·일용근로자", match: ["임시·일용직"], text: "계약 기간이 1년이 안 되는 임시직과 1개월이 안 되는 일용직이에요." },
  { term: "경제활동인구조사", text: "취업자·실업자 수 같은 고용 상황을 조사하는 국가 통계예요." },
  { term: "마이크로데이터", text: "통계를 만든 원래 자료(응답 하나하나)예요." },
  { term: "환율", text: "다른 나라 돈 1단위를 사는 데 드는 우리 돈의 양이에요." },
  { term: "브렌트유", text: "영국 북해에서 나는 원유로, 국제 유가의 기준 중 하나예요." },
  // 주식시장
  { term: "코스피", match: ["KOSPI"], text: "우리나라 대표 주식시장(유가증권시장) 주가 흐름을 보여 주는 지수예요." },
  { term: "VKOSPI", match: ["공포지수"], text: "앞으로 주가가 얼마나 출렁일지 예상한 지수예요. 높을수록 불안이 커요." },
  { term: "나스닥", text: "기술 기업이 많은 미국 주식시장이에요." },
  { term: "중복 상장", text: "모회사와 자회사가 따로 주식시장에 오르는 것이에요. 모회사 주주 몫이 나뉜다는 비판이 있어요." },
  { term: "상장", text: "회사 주식을 주식시장에서 사고팔 수 있게 올리는 것이에요." },
  { term: "주주가치 희석", text: "주식 가치가 나뉘어 기존 주주의 몫이 줄어드는 것이에요." },
  { term: "잉여현금흐름", text: "기업이 번 현금에서 투자 등에 쓰고 남은 돈이에요." },
  { term: "손자회사", text: "자회사가 다시 거느린 회사예요." },
  { term: "서킷브레이커", text: "주가가 너무 크게 떨어지면 주식 거래를 잠시 멈추는 제도예요." },
  { term: "사이드카", text: "선물 가격이 크게 움직이면 프로그램 매매를 잠시 멈추는 제도예요." },
];

export interface Note {
  term: string;
  text: string;
}

/** 찾을 말 목록 — (찾는 말, 풀이) 긴 말부터 */
export function noteIndex(extra: Note[] = []): { find: string; note: Note }[] {
  const out: { find: string; note: Note }[] = [];
  const seen = new Set<string>();
  // 기사에 붙은 풀이가 먼저 (같은 말이면 사전보다 우선)
  for (const n of extra) {
    if (!n.term || seen.has(n.term)) continue;
    seen.add(n.term);
    out.push({ find: n.term, note: n });
  }
  for (const g of GLOSSARY) {
    for (const find of [g.term, ...(g.match ?? [])]) {
      if (seen.has(find)) continue;
      seen.add(find);
      out.push({ find, note: { term: g.term, text: g.text } });
    }
  }
  return out.sort((a, b) => b.find.length - a.find.length);
}

/** 글 속 그 말의 자리 (from 부터, 영문 약자는 낱말 가운데 자리를 건너뛰어요 — ETF 속 TF 같은 것). 없으면 -1 */
export function termIndex(text: string, find: string, from = 0): number {
  const ascii = /^[A-Za-z]+$/.test(find);
  let at = text.indexOf(find, from);
  while (at >= 0 && ascii && (/[A-Za-z]/.test(text[at - 1] ?? "") || /[A-Za-z]/.test(text[at + find.length] ?? ""))) at = text.indexOf(find, at + 1);
  return at;
}

/** 글에서 찾은 말 (겹치는 자리는 긴 말이 이겨요) — 나온 순서대로, 같은 풀이는 한 번만 */
export function findNotes(text: string, index: { find: string; note: Note }[]): { find: string; note: Note; at: number }[] {
  const taken: [number, number][] = [];
  const hits: { find: string; note: Note; at: number }[] = [];
  for (const it of index) {
    let from = 0;
    while (true) {
      const at = termIndex(text, it.find, from);
      if (at < 0) break;
      const end = at + it.find.length;
      if (!taken.some(([s, e]) => at < e && end > s)) {
        taken.push([at, end]);
        hits.push({ ...it, at });
        break;
      }
      from = at + 1;
    }
  }
  const seen = new Set<string>();
  return hits
    .sort((a, b) => a.at - b.at)
    .filter((h) => {
      if (seen.has(h.note.term)) return false;
      seen.add(h.note.term);
      return true;
    });
}

/** 기사에 붙는 풀이(notes) 읽기 — [{ term, text }] */
export function parseNotes(raw: unknown): Note[] {
  let v: unknown = raw;
  if (typeof raw === "string") {
    try {
      v = JSON.parse(raw || "[]");
    } catch {
      return [];
    }
  }
  if (!Array.isArray(v)) return [];
  const s = (x: unknown, max: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, max) : "");
  return v
    .map((n) => (n && typeof n === "object" ? (n as Record<string, unknown>) : {}))
    .map((n) => ({ term: s(n.term, 30), text: s(n.text, 140) }))
    .filter((n) => n.term && n.text)
    .slice(0, 8);
}
