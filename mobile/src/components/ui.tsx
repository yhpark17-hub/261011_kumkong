import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { avatarColor, EVENT_COLOR, PHASE_COLOR } from '@/constants/events';
import { Fonts, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useAlerts } from '@/hooks/alerts';
import { useFavorites } from '@/hooks/favorites';
import { useTheme } from '@/hooks/use-theme';
import { ddayLabel, diffDays } from '@/shared/date';
import { EVENT_META } from '@/shared/meta';
import type { PhaseTone } from '@/shared/schedule';
import type { CatalogCompany, EventType } from '@/shared/types';

/** 작은 둥근 꼬리표 */
export function Tag({ children, fg, bg, style }: { children: ReactNode; fg: ThemeColor; bg: ThemeColor; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return (
    <View style={[styles.tag, { backgroundColor: c[bg] }, style]}>
      <ThemedText type="caption" style={{ color: c[fg], fontFamily: Fonts.semibold }}>
        {children}
      </ThemedText>
    </View>
  );
}

export function EventTag({ type, label }: { type: EventType; label?: string }) {
  const { fg, soft } = EVENT_COLOR[type];
  return (
    <Tag fg={fg} bg={soft}>
      {label ?? EVENT_META[type].label}
    </Tag>
  );
}

export function PhaseTag({ label, tone }: { label: string; tone: PhaseTone }) {
  const { fg, bg } = PHASE_COLOR[tone];
  return (
    <Tag fg={fg} bg={bg}>
      {label}
    </Tag>
  );
}

/** D-day — 기간 일정이 진행 중이면 '진행중', 이틀 안이면 빨갛게 */
export function DDayBadge({ today, date, endDate }: { today: string; date: string; endDate?: string }) {
  const c = useTheme();
  const inRange = Boolean(endDate && date <= today && today <= endDate);
  const diff = diffDays(today, date);
  const hot = !inRange && diff >= 0 && diff <= 1;
  const bg = inRange ? c.evWritten : hot ? c.ruby : c.canvasSoft;
  const fg = inRange || hot ? c.onPrimary : c.inkSecondary;
  return (
    <View style={[styles.dday, { backgroundColor: bg }]}>
      <ThemedText type="caption" style={{ color: fg, fontFamily: Fonts.bold, fontVariant: ['tabular-nums'] }}>
        {inRange ? '진행중' : ddayLabel(diff)}
      </ThemedText>
    </View>
  );
}

const AVATAR_SIZE = { sm: 32, md: 40, lg: 56 } as const;

/** 기관 로고 (없으면 색 바탕에 약칭) */
export function CompanyAvatar({
  company,
  size = 'md',
}: {
  company: Pick<CatalogCompany, 'id' | 'shortName' | 'avatar' | 'logo'>;
  size?: keyof typeof AVATAR_SIZE;
}) {
  const c = useTheme();
  const px = AVATAR_SIZE[size];
  const box = { width: px, height: px, borderRadius: size === 'lg' ? Radius.lg : Radius.md };
  if (company.logo) {
    return (
      // 로고는 흰 바탕을 전제로 만든 그림이라 다크 모드에서도 흰 상자에 둔다
      <View style={[styles.avatar, box, { borderColor: c.hairline, backgroundColor: '#ffffff', padding: px / 10 }]}>
        <Image source={company.logo} style={styles.fill} contentFit="contain" transition={120} />
      </View>
    );
  }
  const text = company.avatar ?? company.shortName.slice(0, 3);
  return (
    <View style={[styles.avatar, box, { backgroundColor: avatarColor(company.id), borderColor: 'transparent' }]}>
      <ThemedText
        style={{ color: '#ffffff', fontFamily: Fonts.bold, fontSize: px / (text.length > 2 ? 3.6 : 3), lineHeight: px / 2 }}>
        {text}
      </ThemedText>
    </View>
  );
}

/** 관심 기관 ★ (이 기기에만 저장) */
export function FavoriteStar({ companyId, size = 22 }: { companyId: string; size?: number }) {
  const c = useTheme();
  const { isFavorite, toggle } = useFavorites();
  const alerts = useAlerts();
  const on = isFavorite(companyId);
  const press = () => {
    toggle(companyId);
    // 처음 ★를 누를 때 한 번만 — 알림 받을지 물어봐요 (나중에 설정에서도 켤 수 있어요)
    if (!on && !alerts.prefs.asked && alerts.permission !== 'unsupported') {
      Alert.alert('관심 기관 일정을 알려 드릴까요?', '서류 마감·필기·면접·발표 전날 오전 9시와 당일 오전 8시에 알려 드려요.', [
        { text: '나중에', style: 'cancel', onPress: alerts.markAsked },
        { text: '알림 받기', onPress: () => void alerts.enable() },
      ]);
    }
  };
  return (
    <Pressable
      onPress={press}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={on ? '관심 기관에서 빼기' : '관심 기관에 추가'}
      accessibilityState={{ selected: on }}>
      <ThemedText style={{ fontSize: size, lineHeight: size + 4, color: on ? c.primary : c.inkMute }}>
        {on ? '★' : '☆'}
      </ThemedText>
    </Pressable>
  );
}

/** 구역 머리: 제목 + 오른쪽 '전체 ›' */
export function SectionHeader({ title, href, more = '전체' }: { title: string; href?: Href; more?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="section">{title}</ThemedText>
      {href && (
        <Link href={href} asChild>
          <Pressable hitSlop={8}>
            <ThemedText type="label" themeColor="primaryText">
              {more} ›
            </ThemedText>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

/** 선택 칩 (필터) */
export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, { backgroundColor: active ? c.brandDark : c.canvasSoft }]}>
      <ThemedText type="label" style={{ color: active ? c.onPrimary : c.inkSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** 회색 채움 카드 */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[styles.card, { backgroundColor: c.canvasSoft }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  tag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  dday: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, minWidth: 44, alignItems: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { borderRadius: Radius.md, paddingHorizontal: Spacing.three, height: 36, justifyContent: 'center' },
  card: { borderRadius: Radius.lg, padding: Spacing.four },
});
