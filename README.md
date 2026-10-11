# 금콩 — 금융공기업 채용 캘린더

금융공기업·공공기관·공제회·중앙회·시중은행 채용 일정(서류 마감·필기·면접·발표)을 한 달력에서 보여주는 웹사이트입니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드
npm run start      # 빌드 결과 실행
```

## 폴더 구조

```
src/
├─ app/                     # 페이지 (Next.js App Router)
│  ├─ page.tsx              # 메인: 임박 일정 + 달력 + 사이드바
│  ├─ companies/            # 기관 비교표, 기관 상세(/companies/[id])
│  ├─ board/                # 콩밭: 익명 게시판 (목록·글·글쓰기·수정·운영정책) + actions.ts
│  ├─ reviews/              # 필기 후기: 시험별 간편 투표·결과 그래프 + actions.ts
│  ├─ admin/                # 운영자 로그인·신고 관리 + actions.ts
│  ├─ guide/                # 필기 가이드 (SEO·애드센스 승인용 콘텐츠)
│  ├─ about/, privacy/      # 서비스 소개, 개인정보처리방침 (애드센스 필수)
│  ├─ sitemap.ts, robots.ts # 검색엔진용
│  └─ ads.txt/route.ts      # 애드센스 ads.txt 자동 생성
├─ components/
│  ├─ calendar/             # 달력, 필터, 임박 일정, 사이드바
│  ├─ company/              # 기관 상세 패널, 타임라인, 필기·자소서 섹션
│  ├─ board/, reviews/      # 게시판·후기 화면 조각 (폼, 표, 그래프, 운영자 버튼)
│  └─ ads/AdSlot.tsx        # 광고 슬롯 (미설정 시 개발 모드에서 자리표시)
├─ data/
│  ├─ companies.ts          # 기관 정보: 블라인드, 필기 구성, 경쟁률
│  └─ recruitments.ts       # 채용 일정, 직렬, 자소서 항목
└─ lib/                     # 타입, 날짜 유틸, 표시용 메타데이터
   └─ server/               # DB 연결·스키마, 보안(IP 해시·비밀번호·운영자 세션·도배 방지), 조회 함수
```

## 콩밭(익명 게시판) · 필기 후기

- **익명 글쓰기**: 회원가입 없이 닉네임 + 비밀번호(수정·삭제용)로 글·댓글을 씁니다. 닉네임 옆에는 IP 앞 두 자리만 보이고, DB에는 IP 원본 대신 해시만 저장합니다.
- **운영자 글**: `/admin/login`에서 로그인하면 글·댓글에 '운영자' 배지가 붙고, 공지 고정·간단한 서식(## 소제목, **굵게**, - 목록, > 인용, [링크](https://…))을 쓸 수 있습니다. '운영자·관리자·금콩'이 들어간 닉네임은 일반 이용자가 쓸 수 없습니다.
- **필기 후기**: 채용 데이터의 필기 일정에서 시험 목록을 자동으로 만들고(`/reviews/[기관id-날짜]`), 시험일이 지나면 투표가 열립니다. 브라우저당 1회(쿠키) + 같은 IP 최대 3명으로 중복을 막고, 다시 내면 수정됩니다.
  - **응시 확인 + 응시자 우선 공개**: 시험 후 14일 안에 처음 들어오면 "#월 #일 시험에 응시하셨나요?"를 묻습니다. 시험일 포함 3일(`PRIORITY_DAYS`) 동안 상세 결과는 후기를 남긴 사람에게만 보이고(서버에서 잠금), 그 뒤에는 누구나 봅니다. 미응시자는 기다리면 볼 수 있으니 허위로 참여할 이유가 줄고, 응시자는 '미응시'를 누르면 3일을 기다려야 하므로 정직하게 답하는 쪽이 가장 빠릅니다.
  - **못 푼(찍은) 문항 수**: NCS·전공 영역별로 구간(0 / 1~3 / 4~6 / 7~10 / 11~15 / 16+)을 고르게 하고, 아는 사람만 총 문항 수를 적게 합니다. 총 문항 수는 제보 3건 이상 + 절반 이상 일치할 때만 보여 주고, 그때 "약 몇 문항 풀이"도 함께 계산합니다. 회차 이름에 영역이 적혀 있으면(예: "2차 필기 (전공·논술)") 그 영역만 묻고, 논술은 제외합니다.
- **기관 구분 칩**: 기관 비교·필기 후기 목록은 대표 4개 구분(금융공기업·금융유관기관·일반 공공기관·공제회·조합)만 먼저 보여 주고 나머지는 '더보기'로 펼칩니다 (`src/components/CategoryChips.tsx`의 `PRIMARY_CATEGORIES`).
- **제보·의견 보내기**: 기관 상세(사이드 카드·하단 문구)와 기관 패널의 '정보 제보하기', 헤더의 '공고 제보하기', 화면 오른쪽 아래 '의견 보내기'·푸터 링크가 같은 팝업(`src/components/feedback/Feedback.tsx`)을 엽니다. 내용·근거 링크·보낸 화면이 `feedback` 테이블에 쌓이고 `/admin`의 '제보·의견'에서 처리 완료/삭제합니다(처리하면 답변용 이메일은 지워짐). 운영자로 로그인하면 콩밭 상단 띠에 '새 제보 N' 배지가 보입니다.
- **콩밭 기관별 보기**: 목록에 '기관' 열이 있고, '기관별 보기'에서 검색해 고르거나 기관 이름을 누르면 그 기관 글만 봅니다 (`/board?company=fss`).
- **도배·신고**: 글 30초·댓글 10초 간격 제한, 금칙어, 링크 2개 제한, 숨은 스팸 함정 칸. 신고 5건이면 자동 숨김 → `/admin`에서 복구·삭제.

### 환경변수 (.env.local)

| 이름 | 설명 |
| --- | --- |
| `DATABASE_URL` | 로컬은 `file:data/kumkong.db`(자동 생성). 배포 시 Turso 주소 `libsql://…` |
| `DATABASE_AUTH_TOKEN` | Turso 토큰 (로컬 파일 DB는 불필요) |
| `ADMIN_PASSWORD` | 운영자 로그인 비밀번호 |
| `ADMIN_SECRET` | 운영자 세션 서명 키 (16자 이상 무작위 문자열) |
| `IP_SALT` | IP 해시용 무작위 문자열 (한 번 정하면 바꾸지 마세요 — 바꾸면 중복 방지 기록이 초기화됨) |

로컬 개발용 값은 `.env.local`에 이미 무작위로 만들어 두었습니다. 운영자 비밀번호는 그 파일에서 확인하고, 배포할 때는 새 값으로 바꿔 Vercel 환경변수에 넣으세요.

### 배포 시 DB

Vercel 같은 서버리스 환경은 파일이 유지되지 않으므로 로컬 SQLite 파일 대신 [Turso](https://turso.tech)(SQLite 호환, 무료 플랜 있음)를 씁니다.

```bash
turso db create kumkong
turso db show kumkong --url        # → DATABASE_URL
turso db tokens create kumkong     # → DATABASE_AUTH_TOKEN
```

테이블은 첫 요청 때 자동으로 만들어집니다(`src/lib/server/db.ts`의 SCHEMA).

## 데이터 업데이트

일정은 `src/data/recruitments.ts`, 기관 정보는 `src/data/companies.ts`에서 수정합니다.

- `status: "confirmed"` — 올해 공고로 확인된 일정 (달력에 실선 칩)
- `status: "expected"` — 공고 전 전년도 기준 예상 일정 (달력에 점선 칩, '예상' 표시)
- 날짜는 `YYYY-MM-DD`(한국 시간), 기간은 `endDate`, 마감 시각은 `time: "18:00"`
- 모르는 값은 지어내지 말고 비워 두세요. 화면에 "확인 중"으로 표시됩니다.
- 같은 단계가 여러 회차면 `label`로 구분합니다 (예: `"1차 면접 ① 집단토론"`).
- `sourceUrl`·`confidence`(high = 공고문 원문 대조)를 넣으면 화면에 출처와 검증 수준이 표시됩니다.

### 리서치 결과 일괄 반영

직접 정리한 기관(`src/data/*.ts`) 외의 기관은 리서치 JSON을 병합해 `src/data/generated/*.json`으로 만듭니다.

```bash
node scripts/merge-research.mjs research1.json research2.json --report report.txt
```

날짜 형식, 전형 순서 역전, 라벨 없는 중복 단계, 경쟁률(지원자÷채용) 불일치를 자동 검사하고 확인할 항목을 리포트로 남깁니다.

### 로고

```bash
node --use-system-ca scripts/fetch-logos.mjs            # 로고 없는 기관만
node --use-system-ca scripts/fetch-logos.mjs --only lh,ex
node scripts/promote-wide-logos.mjs                     # 정사각형에 가까운 가로형 로고를 아바타로도 사용
```

공식 홈페이지 아이콘과 `scripts/logo-sources.json`(기관 공식 CI 페이지의 심볼 이미지 URL·잘라낼 영역)을 바탕으로 `public/logos/`에 128px PNG를 만듭니다. 로고는 각 기관의 상표이며 기관 식별 목적으로만 표시합니다. 정식 서비스 전에는 기관별 CI 사용 지침을 확인하세요.

## 광고 (Google AdSense)

1. 도메인 연결 후 배포 → AdSense 가입 및 사이트 등록
2. `.env.example`을 `.env.local`로 복사해 `NEXT_PUBLIC_ADSENSE_CLIENT`와 슬롯 ID 입력
3. `/ads.txt`는 퍼블리셔 ID로 자동 생성됩니다

광고 위치: 임박 일정 아래 배너, 사이드바 사각형 + 스크롤 고정형, 목록 보기 인피드, 기관 상세 본문 중간·하단,
콩밭 목록 인피드(10번째 글 뒤)·글 본문 아래, 필기 후기 목록 인피드·결과 그래프 아래.
기관 상세 패널(팝업) 안에는 정책상 광고를 넣지 않았습니다.

## 배포

Vercel에 저장소를 연결하면 별도 설정 없이 배포됩니다. 환경변수는 Vercel 프로젝트 설정에 입력하세요.
