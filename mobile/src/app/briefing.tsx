import { Stack, router, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { briefingPath, type AppStory, type BriefingResponse, type Edition, type NearIssue } from '@/api/briefing';
import { useApi } from '@/api/use-api';
import { Deck } from '@/components/briefing/deck';
import { LoadState } from '@/components/screen';
import { Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { keepAll } from '@/lib/keep-all';
import { formatShort } from '@/shared/date';

/** 브리핑 화면은 다크 모드에서도 밝은 종이 (사이트 .theme-light) */
const P = Colors.light;

export default function BriefingScreen() {
  const params = useLocalSearchParams<{ date?: string; edition?: Edition }>();
  const edition: Edition = params.edition === 'noon' ? 'noon' : 'morning';
  const { data, loading, error, refresh } = useApi<BriefingResponse>(briefingPath({ date: params.date, edition }));
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const width = Math.min(screenW, MaxContentWidth);

  const scroller = useRef<ScrollViewInstance>(null);
  const storiesY = useRef(0);
  const [tops, setTops] = useState<Record<number, number>>({});
  const [active, setActive] = useState<number | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<number>>(new Set());
  const markSeen = (id: number) => setSeen((s) => (s.has(id) ? s : new Set([...s, id])));

  const issue = data?.issue;
  const stories = data?.stories ?? [];

  // 화면 위쪽 1/3쯤을 지나는 기사 = 지금 읽는 기사
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y + e.nativeEvent.layoutMeasurement.height * 0.35;
    let current: number | null = null;
    for (const s of stories) {
      const top = tops[s.id];
      if (top != null && storiesY.current + top <= y) current = s.id;
    }
    if (current !== active) setActive(current);
  };
  const jump = (id: number) => {
    const top = tops[id];
    if (top != null) scroller.current?.scrollTo({ y: storiesY.current + top - 72, animated: true });
  };
  const share = () => issue && Share.share({ message: `${issue.title}\n${issue.shareUrl}`, url: issue.shareUrl });

  return (
    <View style={[styles.fill, { backgroundColor: P.canvas }]}>
      <Stack.Screen
        options={{
          title: issue?.label ?? '금콩 브리핑',
          headerRight: issue
            ? () => (
                <Pressable onPress={share} hitSlop={10} accessibilityLabel="공유">
                  <Text style={styles.headerAction}>공유</Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      {!data ? (
        <LoadState loading={loading} error={error ?? (loading ? null : '브리핑을 불러오지 못했어요.')} onRetry={refresh} />
      ) : (
        <ScrollView
          ref={scroller}
          stickyHeaderIndices={stories.length ? [1] : undefined}
          onScroll={onScroll}
          scrollEventThrottle={64}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.six }}>
          <View style={[styles.masthead, styles.page, { width }]}>
            <Text style={styles.meta}>
              {formatShort(data.issue.date)} · {data.issue.edition === 'morning' ? '아침판' : '점심판'} · {data.issue.minutes}분
            </Text>
            <Text style={styles.issueTitle} lineBreakStrategyIOS="hangul-word">
              {keepAll(data.issue.title)}
            </Text>
            {data.issue.edition === 'noon' && data.issue.lede ? <Text style={styles.lede}>{keepAll(data.issue.lede)}</Text> : null}
          </View>

          {stories.length > 0 && (
            <Timetable stories={stories} active={active} seen={seen} onPress={jump} width={width} />
          )}

          <View
            style={[styles.page, styles.stories, { width }]}
            onLayout={(e) => {
              storiesY.current = e.nativeEvent.layout.y;
            }}>
            {stories.length === 0 ? (
              <Pressable onPress={() => openBrowserAsync(data.issue.webUrl)} style={styles.webButton}>
                <Text style={styles.webButtonText}>{edition === 'noon' ? '금콩 스터디 열기 ↗' : '웹에서 보기 ↗'}</Text>
              </Pressable>
            ) : (
              stories.map((s) => (
                <View
                  key={s.id}
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    setTops((t) => (t[s.id] === y ? t : { ...t, [s.id]: y }));
                  }}>
                  <Deck story={s} width={width} onSeen={markSeen} />
                </View>
              ))
            )}
          </View>

          <View style={[styles.page, styles.around, { width }]}>
            <Near label="이전 호" issue={data.prev} />
            <Near label="다음 호" issue={data.next} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

/** 오늘의 시간표 — 위에 붙는 한 줄 칩. 지금 읽는 기사는 진하게, 끝까지 넘겨 본 기사는 ✓ */
function Timetable({
  stories,
  active,
  seen,
  onPress,
  width,
}: {
  stories: AppStory[];
  active: number | null;
  seen: ReadonlySet<number>;
  onPress: (id: number) => void;
  width: number;
}) {
  return (
    <View style={styles.timetable}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { minWidth: width }]}>
        {stories.map((s) => {
          const on = s.id === active;
          const done = seen.has(s.id);
          return (
            <Pressable
              key={s.id}
              onPress={() => onPress(s.id)}
              accessibilityState={{ selected: on }}
              style={[styles.chip, on ? { backgroundColor: P.brandDark } : { backgroundColor: P.canvasSoft }]}>
              <View style={[styles.chipNo, { backgroundColor: on ? P.canvas : done ? P.primary : P.brandDark }]}>
                <Text style={[styles.chipNoText, { color: on ? P.brandDark : P.onPrimary }]}>{done ? '✓' : s.no}</Text>
              </View>
              <View style={styles.chipBody}>
                <Text style={[styles.chipSection, { color: on ? 'rgba(255,255,255,0.75)' : s.theme.accent }]}>{s.sectionLabel}</Text>
                <Text numberOfLines={1} style={[styles.chipLabel, { color: on ? P.onPrimary : P.ink }]}>
                  {s.short}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Near({ label, issue }: { label: string; issue: NearIssue }) {
  if (!issue) return <View style={styles.flex} />;
  const open = () => router.push({ pathname: '/briefing', params: { date: issue.date, edition: issue.edition } });
  return (
    <Pressable onPress={open} style={[styles.near, styles.flex]}>
      <Text style={styles.nearLabel}>
        {label} · {formatShort(issue.date)}
      </Text>
      <Text numberOfLines={2} style={styles.nearTitle}>
        {issue.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  page: { alignSelf: 'center', paddingHorizontal: Spacing.four },
  headerAction: { fontFamily: Fonts.semibold, fontSize: 16, color: P.primary },
  masthead: { paddingTop: Spacing.four, paddingBottom: Spacing.three, gap: 6 },
  meta: { fontFamily: Fonts.semibold, fontSize: 13, color: P.inkMute },
  issueTitle: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.5, color: P.ink },
  lede: { marginTop: 6, fontFamily: Fonts.regular, fontSize: 16, lineHeight: 26, color: P.inkSecondary },
  timetable: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: P.hairline,
    paddingVertical: 8,
  },
  chips: { paddingHorizontal: Spacing.four, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingLeft: 6, paddingRight: 12, paddingVertical: 6, maxWidth: 220 },
  chipNo: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipNoText: { fontFamily: Fonts.bold, fontSize: 12 },
  chipBody: { flexShrink: 1 },
  chipSection: { fontFamily: Fonts.semibold, fontSize: 11, lineHeight: 14 },
  chipLabel: { fontFamily: Fonts.semibold, fontSize: 13, lineHeight: 18 },
  stories: { paddingTop: Spacing.five, gap: 44 },
  webButton: { height: 52, borderRadius: 14, backgroundColor: P.primary, alignItems: 'center', justifyContent: 'center' },
  webButtonText: { fontFamily: Fonts.semibold, fontSize: 15, color: P.onPrimary },
  around: { marginTop: Spacing.six, flexDirection: 'row', gap: Spacing.three },
  near: { borderRadius: 14, backgroundColor: P.canvasSoft, padding: Spacing.four, gap: 4 },
  nearLabel: { fontFamily: Fonts.semibold, fontSize: 12, color: P.inkMute },
  nearTitle: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20, color: P.ink },
});
