import { Stack, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCatalog } from '@/api/catalog';
import type { CompanyDetailResponse } from '@/api/client';
import { useApi } from '@/api/use-api';
import { openCompany } from '@/components/events';
import { LoadState } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card, CompanyAvatar, DDayBadge, FavoriteStar, PhaseTag, Tag } from '@/components/ui';
import { BLIND_COLOR, EVENT_COLOR } from '@/constants/events';
import { siteUrl } from '@/constants/site';
import { Fonts, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { formatLong, formatRange, formatShort } from '@/shared/date';
import { formatRatio, nf } from '@/shared/format';
import { BLIND_META, CATEGORY_META, EVENT_META, MAJOR_META } from '@/shared/meta';
import { recruitmentPhase, sortedEvents } from '@/shared/schedule';
import type { Company, CompetitionStat, Recruitment } from '@/shared/types';

export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const catalog = useCatalog();
  const brief = catalog.company(id);
  const detail = useApi<CompanyDetailResponse>(`/companies/${encodeURIComponent(id)}`);
  const d = detail.data;

  const recruitment = d?.recruitment ?? catalog.recruitment(id);
  const phase = recruitment ? recruitmentPhase(recruitment, today) : null;
  const postingUrl = d ? (d.recruitment.postingUrl ?? d.company.recruitUrl) : undefined;

  return (
    <ThemedView style={styles.fill}>
      <Stack.Screen
        options={{ title: brief?.shortName ?? '', headerRight: () => <FavoriteStar companyId={id} size={24} /> }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}>
        {brief && (
          <View style={styles.hero}>
            <CompanyAvatar company={brief} size="lg" />
            <View style={styles.flex}>
              <View style={styles.tags}>
                <Tag fg="inkSecondary" bg="canvasSoft">
                  {CATEGORY_META[brief.category].label}
                </Tag>
                {brief.blind !== 'unknown' && (
                  <Tag fg={BLIND_COLOR[brief.blind].fg} bg={BLIND_COLOR[brief.blind].bg}>
                    {BLIND_META[brief.blind].label}
                  </Tag>
                )}
                {phase && <PhaseTag label={phase.label} tone={phase.tone} />}
              </View>
              <ThemedText type="title" style={styles.name}>
                {brief.name}
              </ThemedText>
              {recruitment && <ThemedText type="small">{recruitment.title}</ThemedText>}
            </View>
          </View>
        )}

        {!d ? (
          <LoadState loading={detail.loading} error={detail.error} onRetry={detail.refresh} />
        ) : (
          <>
            {d.recruitment.status === 'expected' && d.recruitment.events.length > 0 && (
              <Card style={{ backgroundColor: c.canvasCream }}>
                <ThemedText type="small" themeColor="inkSecondary">
                  <ThemedText type="small" themeColor="lemon">
                    예상 일정
                  </ThemedText>
                  {' · 아직 올해 공고가 나오지 않아 전년도 일정을 기준으로 표시했어요. 공고가 나오면 바로 업데이트돼요.'}
                </ThemedText>
              </Card>
            )}

            <Section title="전형 일정">
              <Timeline recruitment={d.recruitment} today={today} />
              {d.recruitment.note && <ThemedText type="caption">※ {d.recruitment.note}</ThemedText>}
              <SourceNote recruitment={d.recruitment} />
            </Section>

            <Section title="한눈에 보기">
              <QuickFacts company={d.company} alioListed={d.alioListed} />
            </Section>

            <Section title="필기 구성">
              {d.sameDayWritten && (
                <Card style={{ backgroundColor: c.evWrittenSoft }}>
                  <ThemedText type="label" themeColor="evWritten">
                    {formatShort(d.sameDayWritten.date)} 같은 날 필기 — 응시 기관을 골라야 해요
                  </ThemedText>
                  <View style={[styles.tags, styles.gapTop]}>
                    {d.sameDayWritten.companies.map((o) => (
                      <Pressable key={o.id} onPress={() => openCompany(o.id)} style={[styles.pill, { backgroundColor: c.canvas }]}>
                        <ThemedText type="caption" themeColor="inkSecondary">
                          {o.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </Card>
              )}
              <ExamDetail company={d.company} />
            </Section>

            <Section title="모집 직렬">
              {d.recruitment.tracks.length ? (
                <View style={styles.tags}>
                  {d.recruitment.tracks.map((t) => (
                    <Tag key={t} fg="inkSecondary" bg="canvasSoft">
                      {t}
                    </Tag>
                  ))}
                </View>
              ) : (
                <ThemedText type="small">공고 확인 중</ThemedText>
              )}
              {d.recruitment.headcount != null && (
                <ThemedText themeColor="inkSecondary">
                  채용 인원{' '}
                  <ThemedText type="heading">{`${nf.format(d.recruitment.headcount)}명`}</ThemedText>
                </ThemedText>
              )}
            </Section>

            <Section title="자기소개서 항목">
              <EssayList recruitment={d.recruitment} />
            </Section>

            <Section title="경쟁률">
              <StatsList company={d.company} alioListed={d.alioListed} />
            </Section>

            <ThemedText type="caption">최종 확인 {formatLong(d.recruitment.updatedAt)}</ThemedText>

            <View style={styles.actions}>
              {postingUrl && (
                <Pressable
                  onPress={() => openBrowserAsync(postingUrl)}
                  style={[styles.button, { backgroundColor: c.primary }]}>
                  <ThemedText type="label" themeColor="onPrimary">
                    채용 공고 보기 ↗
                  </ThemedText>
                </Pressable>
              )}
              <Pressable
                onPress={() => openBrowserAsync(siteUrl(`/companies/${id}`))}
                style={[styles.button, { backgroundColor: c.canvasSoft }]}>
                <ThemedText type="label" themeColor="inkSecondary">
                  금콩 웹에서 보기
                </ThemedText>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="section">{title}</ThemedText>
      {children}
    </View>
  );
}

/** 전형 일정 타임라인 (사이트 RecruitTimeline) */
function Timeline({ recruitment, today }: { recruitment: Recruitment; today: string }) {
  const c = useTheme();
  const events = sortedEvents(recruitment);
  const nextIdx = events.findIndex((e) => (e.endDate ?? e.date) >= today);

  if (!events.length) {
    return (
      <Card style={{ backgroundColor: c.canvasCream }}>
        <ThemedText type="small" themeColor="inkSecondary">
          아직 확인된 채용 일정이 없어요. ☆로 관심 기관에 넣어 두면 공고가 나왔을 때 홈에서 바로 볼 수 있어요.
        </ThemedText>
      </Card>
    );
  }

  return (
    <View>
      {events.map((e, i) => {
        const color = EVENT_COLOR[e.type];
        const past = (e.endDate ?? e.date) < today;
        const isNext = i === nextIdx;
        const last = i === events.length - 1;
        return (
          <View key={`${e.type}-${i}`} style={styles.tlRow}>
            <View style={styles.tlRail}>
              <View
                style={[
                  styles.tlDot,
                  past
                    ? { backgroundColor: c.canvasSoft, borderColor: c.hairline }
                    : { backgroundColor: c[color.soft], borderColor: isNext ? c[color.fg] : 'transparent' },
                ]}>
                {past ? (
                  <ThemedText style={[styles.tlCheck, { color: c.inkMute }]}>✓</ThemedText>
                ) : (
                  <View style={[styles.tlCore, { backgroundColor: c[color.fg] }]} />
                )}
              </View>
              {!last && <View style={[styles.tlLine, { backgroundColor: past ? c.hairlineInput : c.hairline }]} />}
            </View>
            <View style={[styles.tlBody, isNext && { backgroundColor: c[color.soft] }]}>
              <View style={styles.flex}>
                <ThemedText type="heading" themeColor={past ? 'inkMute' : 'ink'}>
                  {e.label ?? EVENT_META[e.type].label}
                  {recruitment.status === 'expected' ? <ThemedText type="caption">{'  (예상)'}</ThemedText> : null}
                </ThemedText>
                <ThemedText type="small" themeColor={past ? 'inkMute' : 'inkSecondary'} style={styles.tabular}>
                  {formatRange(e.date, e.endDate)}
                  {e.time ? ` ${e.time}` : ''}
                </ThemedText>
                {e.note && <ThemedText type="caption">{e.note}</ThemedText>}
              </View>
              {!past && <DDayBadge today={today} date={e.date} endDate={e.endDate} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const CONFIDENCE_LABEL: Record<NonNullable<Recruitment['confidence']>, { text: string; fg: ThemeColor; bg: ThemeColor }> = {
  high: { text: '공고문 원문 대조', fg: 'evFinal', bg: 'evFinalSoft' },
  medium: { text: '일부 2차 출처', fg: 'lemon', bg: 'canvasCream' },
  low: { text: '2차 출처 위주', fg: 'evDoc', bg: 'evDocSoft' },
};

function SourceNote({ recruitment }: { recruitment: Recruitment }) {
  const href = recruitment.sourceUrl ?? recruitment.postingUrl;
  if (!href && !recruitment.confidence) return null;
  const conf = recruitment.confidence ? CONFIDENCE_LABEL[recruitment.confidence] : null;
  return (
    <View style={styles.tags}>
      {conf && (
        <Tag fg={conf.fg} bg={conf.bg}>
          {conf.text}
        </Tag>
      )}
      {href && (
        <ThemedText type="caption" themeColor="primaryText" onPress={() => openBrowserAsync(href)} accessibilityRole="link">
          일정 출처 보기 ↗
        </ThemedText>
      )}
    </View>
  );
}

/** 최근 경쟁률 — 경쟁률이 확정된 가장 최근 회차 우선 (사이트 latestStat) */
function latestStat(company: Company): CompetitionStat | undefined {
  const ordered = orderedStats(company);
  return ordered.find((s) => s.ratio != null) ?? ordered.find((s) => s.applicants != null);
}

/** 최신 회차가 앞으로 (같은 해면 데이터 뒤쪽이 최신) */
function orderedStats(company: Company): CompetitionStat[] {
  return company.stats
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.year - a.s.year || b.i - a.i)
    .map((x) => x.s);
}

/** 블라인드 / 필기 / 전공 / 경쟁률 요약 (사이트 QuickFacts) */
function QuickFacts({ company, alioListed }: { company: Company; alioListed: boolean }) {
  const c = useTheme();
  const stat = latestStat(company);
  const w = company.written;
  const items = [
    {
      label: '블라인드',
      value: BLIND_META[company.blind].label,
      sub: BLIND_META[company.blind].desc,
      muted: company.blind === 'unknown',
    },
    {
      label: '필기 유형',
      value: w.ncs.has === false ? 'NCS 없음' : w.ncs.has ? (w.ncs.type ?? 'NCS') : '확인 중',
      sub:
        w.ncs.has && (w.ncs.questions || w.ncs.minutes)
          ? [w.ncs.questions && `${w.ncs.questions}문항`, w.ncs.minutes && `${w.ncs.minutes}분`].filter(Boolean).join(' · ')
          : w.ncs.has === false
            ? (w.extra?.[0] ?? '전공·논술 중심')
            : '',
      muted: w.ncs.has == null,
    },
    {
      label: '전공 시험',
      value: MAJOR_META[w.major.type].label,
      sub: w.major.subjects ?? MAJOR_META[w.major.type].desc,
      muted: w.major.type === 'unknown',
    },
    {
      label: stat ? `${stat.label ?? stat.year} 경쟁률` : '경쟁률',
      value:
        stat?.ratio != null
          ? formatRatio(stat.ratio)!
          : stat?.applicants
            ? `${nf.format(stat.applicants)}명 지원`
            : alioListed
              ? '공시 전'
              : '비공개',
      sub: stat
        ? [
            stat.applicants != null && `지원 ${nf.format(stat.applicants)}명`,
            stat.hires != null && `채용 ${nf.format(stat.hires)}명`,
            stat.source,
          ]
            .filter(Boolean)
            .join(' · ')
        : alioListed
          ? '알리오 공시 확인 필요'
          : '알리오 공시 대상이 아니라 공개 자료 없음',
      muted: !stat,
    },
  ];

  return (
    <View style={styles.facts}>
      {items.map((it) => (
        <View key={it.label} style={[styles.fact, { backgroundColor: c.canvasSoft, borderColor: c.hairline }]}>
          <ThemedText type="caption">{it.label}</ThemedText>
          <ThemedText type="heading" themeColor={it.muted ? 'inkMute' : 'ink'} style={styles.tabular}>
            {it.value}
          </ThemedText>
          {it.sub ? (
            <ThemedText type="caption" numberOfLines={2}>
              {it.sub}
            </ThemedText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

function SubBlock({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.subBlock, { borderColor: c.hairline }]}>
      <View style={styles.tags}>
        <ThemedText type="heading">{title}</ThemedText>
        {aside}
      </View>
      {children}
    </View>
  );
}

/** 필기 구성 상세 (사이트 ExamDetail) */
function ExamDetail({ company }: { company: Company }) {
  const w = company.written;
  const ncsMeta = [w.ncs.questions && `${w.ncs.questions}문항`, w.ncs.minutes && `${w.ncs.minutes}분`].filter(Boolean).join(' · ');
  const majorTone: { fg: ThemeColor; bg: ThemeColor } =
    w.major.type === 'none'
      ? { fg: 'evFinal', bg: 'evFinalSoft' }
      : w.major.type === 'unknown'
        ? { fg: 'inkMute', bg: 'canvasSoft' }
        : { fg: 'evInterview1', bg: 'evInterview1Soft' };
  return (
    <View style={styles.blocks}>
      <SubBlock
        title="직업기초능력 (NCS·인적성)"
        aside={
          <>
            {w.ncs.has && w.ncs.type ? (
              <Tag fg="tagSoftText" bg="tagSoftBg">
                {w.ncs.type}
              </Tag>
            ) : null}
            {ncsMeta ? <ThemedText type="caption">{ncsMeta}</ThemedText> : null}
          </>
        }>
        {w.ncs.has === false ? (
          <ThemedText themeColor="inkSecondary">NCS 직업기초능력 시험 없음</ThemedText>
        ) : w.ncs.subjects.length ? (
          <View style={styles.tags}>
            {w.ncs.subjects.map((s) => (
              <Tag key={s} fg="inkSecondary" bg="canvasSoft">
                {s}
              </Tag>
            ))}
          </View>
        ) : (
          <ThemedText type="small">출제 영역 확인 중</ThemedText>
        )}
      </SubBlock>

      <SubBlock
        title="전공"
        aside={
          <>
            <Tag fg={majorTone.fg} bg={majorTone.bg}>
              {MAJOR_META[w.major.type].label}
            </Tag>
            {w.major.minutes ? <ThemedText type="caption">{`${w.major.minutes}분`}</ThemedText> : null}
          </>
        }>
        <ThemedText themeColor="inkSecondary">{w.major.subjects ?? MAJOR_META[w.major.type].desc}</ThemedText>
      </SubBlock>

      {w.extra && w.extra.length > 0 && (
        <SubBlock title="기타 과목·전형">
          <View style={styles.tags}>
            {w.extra.map((s) => (
              <Tag key={s} fg="inkSecondary" bg="canvasSoft">
                {s}
              </Tag>
            ))}
          </View>
        </SubBlock>
      )}
      {w.note && <ThemedText type="caption">※ {w.note}</ThemedText>}
    </View>
  );
}

function EssayList({ recruitment }: { recruitment: Recruitment }) {
  const c = useTheme();
  const qs = recruitment.essayQuestions;
  if (!qs.length) {
    return (
      <Card style={{ backgroundColor: c.canvasCream }}>
        <ThemedText type="small" themeColor="inkSecondary">
          {recruitment.essayRef ?? '자소서 항목은 공개되는 대로 업데이트돼요.'}
        </ThemedText>
      </Card>
    );
  }
  return (
    <View style={styles.blocks}>
      {recruitment.essayRef && (
        <Tag fg="lemon" bg="canvasCream">
          {recruitment.essayRef}
        </Tag>
      )}
      {qs.map((q, i) => (
        <View key={i} style={[styles.essay, { borderColor: c.hairline }]}>
          <View style={[styles.essayNum, { backgroundColor: c.tagSoftBg }]}>
            <ThemedText type="caption" themeColor="tagSoftText" style={{ fontFamily: Fonts.bold }}>
              {i + 1}
            </ThemedText>
          </View>
          <View style={styles.flex}>
            <ThemedText>{q.q}</ThemedText>
            {q.limit ? (
              <ThemedText type="caption">{`${nf.format(q.limit)}${q.unit === 'byte' ? ' byte' : '자'} 이내`}</ThemedText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/** 경쟁률 회차별 (사이트 StatsTable) */
function StatsList({ company, alioListed }: { company: Company; alioListed: boolean }) {
  const c = useTheme();
  const rows = orderedStats(company);
  if (!rows.length) {
    return (
      <Card>
        <ThemedText type="small">
          {alioListed
            ? '알리오 신규채용 공시를 확인 중이에요.'
            : '알리오 공시 대상 기관이 아니어서 공개된 경쟁률 자료가 없어요.'}
        </ThemedText>
      </Card>
    );
  }
  const maxRatio = Math.max(...rows.map((r) => r.ratio ?? 0), 1);
  return (
    <View style={[styles.stats, { borderColor: c.hairline }]}>
      {rows.map((r, i) => (
        <View key={i} style={[styles.statRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline }]}>
          <View style={styles.statHead}>
            <ThemedText type="heading" style={styles.tabular}>
              {r.label ?? String(r.year)}
              <ThemedText type="caption">{`  ${r.source}`}</ThemedText>
            </ThemedText>
            <ThemedText type="heading" themeColor={r.ratio != null ? 'ink' : 'inkMute'} style={styles.tabular}>
              {r.ratio != null ? formatRatio(r.ratio) : '-'}
            </ThemedText>
          </View>
          {r.ratio != null && (
            <View style={[styles.bar, { backgroundColor: c.canvasSoft }]}>
              <View
                style={[styles.barFill, { backgroundColor: c.primary, width: `${Math.max(6, (r.ratio / maxRatio) * 100)}%` }]}
              />
            </View>
          )}
          <ThemedText type="caption" style={styles.tabular}>
            {`지원 ${r.applicants != null ? `${nf.format(r.applicants)}명` : '-'} · 채용 ${r.hires != null ? `${nf.format(r.hires)}명` : '-'}`}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  content: { padding: Spacing.four, gap: Spacing.six },
  hero: { flexDirection: 'row', gap: Spacing.four, alignItems: 'flex-start' },
  name: { marginTop: Spacing.two },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  gapTop: { marginTop: Spacing.three },
  pill: { borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  section: { gap: Spacing.three },
  blocks: { gap: Spacing.three },
  tlRow: { flexDirection: 'row', gap: Spacing.three },
  tlRail: { width: 24, alignItems: 'center' },
  tlDot: {
    marginTop: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tlCore: { width: 8, height: 8, borderRadius: 4 },
  tlCheck: { fontSize: 12, lineHeight: 14 },
  tlLine: { flex: 1, width: 1, marginTop: 2 },
  tlBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  fact: {
    width: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.four,
    gap: 2,
  },
  subBlock: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, padding: Spacing.four, gap: Spacing.three },
  essay: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    padding: Spacing.four,
  },
  essayNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stats: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, paddingHorizontal: Spacing.four },
  statRow: { paddingVertical: Spacing.three, gap: Spacing.two },
  statHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  actions: { gap: Spacing.two },
  button: { height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
});
