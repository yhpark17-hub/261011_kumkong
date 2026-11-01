import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CompanyAvatar, DDayBadge, EventTag } from '@/components/ui';
import { EVENT_COLOR } from '@/constants/events';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { diffDays, formatRange } from '@/shared/date';
import type { CalendarEvent } from '@/shared/types';

export const openCompany = (id: string) => router.push({ pathname: '/company/[id]', params: { id } });

/** "10.14 (화) 18:00 마감" */
function When({ ev }: { ev: CalendarEvent }) {
  const c = useTheme();
  return (
    <ThemedText type="small" themeColor="inkSecondary" style={styles.tabular} numberOfLines={1}>
      {formatRange(ev.date, ev.endDate)}
      {ev.time ? <ThemedText type="small" style={{ color: c[EVENT_COLOR[ev.type].fg] }}>{` ${ev.time}`}</ThemedText> : null}
      {ev.type === 'doc' ? ' 마감' : ''}
    </ThemedText>
  );
}

/** 임박 일정 가로 카드 (사이트 UrgentStrip 카드) */
export function UrgentCard({ ev, today }: { ev: CalendarEvent; today: string }) {
  const c = useTheme();
  const hot = diffDays(today, ev.date) <= 1;
  const expected = ev.recruitment.status === 'expected';
  return (
    <Pressable
      onPress={() => openCompany(ev.company.id)}
      style={[
        styles.urgent,
        {
          backgroundColor: hot ? c.evDocSoft : c.canvas,
          borderColor: hot ? c.ruby : c.hairline,
          borderStyle: expected ? 'dashed' : 'solid',
        },
      ]}>
      <View style={styles.between}>
        <EventTag type={ev.type} label={ev.label} />
        <DDayBadge today={today} date={ev.date} endDate={ev.endDate} />
      </View>
      <View style={styles.company}>
        <CompanyAvatar company={ev.company} size="sm" />
        <ThemedText type="heading" numberOfLines={1} style={styles.flex}>
          {ev.company.name}
        </ThemedText>
      </View>
      <When ev={ev} />
      <ThemedText type="caption" numberOfLines={1}>
        {expected ? '예상 · ' : ''}
        {ev.recruitment.title}
      </ThemedText>
    </Pressable>
  );
}

/** 목록 한 줄: 로고 · 기관명 · 일정 꼬리표 · 날짜 · D-day */
export function EventRow({ ev, today }: { ev: CalendarEvent; today: string }) {
  const c = useTheme();
  const past = (ev.endDate ?? ev.date) < today;
  return (
    <Pressable onPress={() => openCompany(ev.company.id)} style={[styles.row, { borderColor: c.hairline }]}>
      <CompanyAvatar company={ev.company} />
      <View style={styles.flex}>
        <View style={styles.titleLine}>
          <ThemedText type="heading" numberOfLines={1} style={styles.shrink}>
            {ev.company.name}
          </ThemedText>
          <EventTag type={ev.type} label={ev.label} />
        </View>
        <ThemedText type="caption" numberOfLines={1}>
          {ev.recruitment.status === 'expected' ? '예상 · ' : ''}
          {ev.time ? `${ev.time} · ` : ''}
          {ev.recruitment.title}
        </ThemedText>
      </View>
      {!past && <DDayBadge today={today} date={ev.date} endDate={ev.endDate} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  company: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  urgent: {
    width: 232,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
