import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { IssueInfo, IssueListItem } from '@/api/briefing';
import { ThemedText } from '@/components/themed-text';
import { Tag } from '@/components/ui';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatShort } from '@/shared/date';

/** 아침판은 앱 카드뉴스, 금콩 스터디(점심판)는 웹 화면 */
export const openIssue = (i: Pick<IssueInfo, 'date' | 'edition'>) =>
  i.edition === 'morning'
    ? router.push({ pathname: '/briefing', params: { date: i.date, edition: i.edition } })
    : router.push({ pathname: '/web', params: { path: `/magazine/letter/${i.date}/noon`, title: '금콩 스터디' } });

const EDITION = { morning: { name: '아침판', fg: 'onPrimary', bg: 'primary' }, noon: { name: '점심판', fg: 'onPrimary', bg: 'lemon' } } as const;

/** 판 색 표지 — 운영자가 표지 그림을 끈 호 (사이트 BriefingCover) */
function BrandCover({ issue }: { issue: IssueInfo }) {
  const P = Colors.light;
  return (
    <LinearGradient colors={[P.brandDark, issue.edition === 'morning' ? P.primary : P.lemon]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cover}>
      <ThemedText style={styles.brandName}>{issue.edition === 'morning' ? '금콩 브리핑' : '금콩 스터디'}</ThemedText>
      <ThemedText style={styles.brandDate}>{formatShort(issue.date)}</ThemedText>
    </LinearGradient>
  );
}

/** 오늘의 브리핑 — 표지 그림 + 제목 + 앞 기사들 */
export function IssueHero({ issue }: { issue: IssueListItem }) {
  const c = useTheme();
  const ed = EDITION[issue.edition];
  return (
    <Pressable onPress={() => openIssue(issue)} style={[styles.hero, { borderColor: c.hairline, backgroundColor: c.canvas }]}>
      {issue.cover ? (
        <Image source={issue.cover} style={styles.cover} contentFit="cover" transition={150} />
      ) : (
        <BrandCover issue={issue} />
      )}
      <View style={styles.heroBody}>
        <View style={styles.meta}>
          <Tag fg={ed.fg} bg={ed.bg}>
            {ed.name}
          </Tag>
          <ThemedText type="caption">
            {formatShort(issue.date)} · {issue.minutes}분{issue.edition === 'morning' ? ` · 기사 ${issue.count}건` : ''}
          </ThemedText>
        </View>
        <ThemedText type="heading" style={styles.heroTitle}>
          {issue.title}
        </ThemedText>
        {issue.top.map((t) => (
          <ThemedText key={t.id} type="small" themeColor="inkSecondary" numberOfLines={1}>
            · {t.title}
          </ThemedText>
        ))}
      </View>
    </Pressable>
  );
}

/** 지난 브리핑 한 줄 */
export function IssueRow({ issue }: { issue: IssueListItem }) {
  const c = useTheme();
  const ed = EDITION[issue.edition];
  return (
    <Pressable onPress={() => openIssue(issue)} style={[styles.row, { borderBottomColor: c.hairline }]}>
      <View style={[styles.bar, { backgroundColor: c[ed.bg] }]} />
      <View style={styles.flex}>
        <ThemedText type="caption">
          {formatShort(issue.date)} · {ed.name} · {issue.label.split(' ').at(-1)}
        </ThemedText>
        <ThemedText type="heading" numberOfLines={2}>
          {issue.title}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.xl, overflow: 'hidden' },
  cover: { width: '100%', aspectRatio: 1200 / 630, justifyContent: 'flex-end', padding: Spacing.four },
  brandName: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 28, color: '#ffffff' },
  brandDate: { fontFamily: Fonts.medium, fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  heroBody: { padding: Spacing.four, gap: Spacing.one },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  heroTitle: { fontSize: 18, lineHeight: 25, marginTop: Spacing.one, marginBottom: Spacing.one },
  row: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.three, borderBottomWidth: StyleSheet.hairlineWidth },
  bar: { width: 4, borderRadius: 2 },
});
