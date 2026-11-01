import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useCatalog } from '@/api/catalog';
import { EventRow } from '@/components/events';
import { LoadState, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Card, Chip } from '@/components/ui';
import { EVENT_COLOR } from '@/constants/events';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/hooks/favorites';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import {
  dayOfWeek,
  formatDayHeading,
  HOLIDAYS,
  monthWeeks,
  parseKey,
  shiftMonth,
  toKey,
  WEEKDAYS,
  ymOf,
  type YearMonth,
} from '@/shared/date';
import { CATEGORY_META, CATEGORY_ORDER } from '@/shared/meta';
import type { CalendarEvent, Category } from '@/shared/types';

const CELL_CHIPS = 2;

export default function CalendarScreen() {
  const c = useTheme();
  const today = useToday();
  const catalog = useCatalog();
  const { favorites } = useFavorites();
  const [ym, setYm] = useState<YearMonth>(() => ymOf(today));
  const [selected, setSelected] = useState(today);
  const [favOnly, setFavOnly] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of catalog.events) {
      if (favOnly && !favorites.has(ev.company.id)) continue;
      if (category && ev.company.category !== category) continue;
      const list = map.get(ev.date);
      if (list) list.push(ev);
      else map.set(ev.date, [ev]);
    }
    return map;
  }, [catalog.events, favOnly, favorites, category]);

  const goMonth = (next: YearMonth) => {
    setYm(next);
    const t = ymOf(today);
    setSelected(next.y === t.y && next.m === t.m ? today : toKey(next.y, next.m, 1));
  };

  const dayEvents = byDay.get(selected) ?? [];

  return (
    <Screen
      title="채용 캘린더"
      refreshing={catalog.refreshing}
      onRefresh={catalog.refresh}
      right={
        <Link href="/companies" asChild>
          <Pressable accessibilityLabel="기관 목록" hitSlop={12}>
            <SymbolView name={{ ios: 'list.bullet', android: 'list', web: 'list' }} size={24} tintColor={c.inkMute} />
          </Pressable>
        </Link>
      }>
      {catalog.companies.length === 0 ? (
        <LoadState loading={catalog.loading} error={catalog.error} onRetry={catalog.refresh} />
      ) : (
        <View style={styles.body}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
            <Chip label="★ 관심만" active={favOnly} onPress={() => setFavOnly((v) => !v)} />
            <Chip label="전체" active={category == null} onPress={() => setCategory(null)} />
            {CATEGORY_ORDER.map((cat) => (
              <Chip
                key={cat}
                label={CATEGORY_META[cat].label}
                active={category === cat}
                onPress={() => setCategory(category === cat ? null : cat)}
              />
            ))}
          </ScrollView>

          <View style={styles.monthBar}>
            <ThemedText type="section">{`${ym.y}년 ${ym.m}월`}</ThemedText>
            <View style={styles.monthNav}>
              <NavButton label="‹" a11y="이전 달" onPress={() => goMonth(shiftMonth(ym, -1))} />
              <Pressable onPress={() => goMonth(ymOf(today))} style={[styles.todayBtn, { backgroundColor: c.canvasSoft }]}>
                <ThemedText type="label" themeColor="inkSecondary">
                  오늘
                </ThemedText>
              </Pressable>
              <NavButton label="›" a11y="다음 달" onPress={() => goMonth(shiftMonth(ym, 1))} />
            </View>
          </View>

          <MonthGrid ym={ym} today={today} selected={selected} byDay={byDay} onSelect={setSelected} />

          <View style={styles.dayList}>
            <ThemedText type="heading">
              {formatDayHeading(selected)}
              {HOLIDAYS[selected] ? <ThemedText type="small" themeColor="ruby">{`  ${HOLIDAYS[selected]}`}</ThemedText> : null}
            </ThemedText>
            {dayEvents.length === 0 ? (
              <Card>
                <ThemedText type="small">
                  {favOnly && favorites.size === 0 ? '아직 고른 관심 기관이 없어요. 기관 목록에서 ☆를 눌러 보세요.' : '이날은 일정이 없어요.'}
                </ThemedText>
              </Card>
            ) : (
              dayEvents.map((ev) => <EventRow key={ev.id} ev={ev} today={today} />)
            )}
          </View>
        </View>
      )}
    </Screen>
  );
}

function NavButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={a11y} hitSlop={6} style={[styles.navBtn, { backgroundColor: c.canvasSoft }]}>
      <ThemedText style={styles.navGlyph} themeColor="inkSecondary">
        {label}
      </ThemedText>
    </Pressable>
  );
}

function MonthGrid({
  ym,
  today,
  selected,
  byDay,
  onSelect,
}: {
  ym: YearMonth;
  today: string;
  selected: string;
  byDay: Map<string, CalendarEvent[]>;
  onSelect: (key: string) => void;
}) {
  const c = useTheme();

  return (
    <View>
      <View style={styles.week}>
        {WEEKDAYS.map((w, i) => (
          <ThemedText
            key={w}
            type="caption"
            style={[styles.weekday, i === 0 && { color: c.ruby }, i === 6 && { color: c.primaryText }]}>
            {w}
          </ThemedText>
        ))}
      </View>
      {monthWeeks(ym).map((week) => (
        <View key={week[0]} style={[styles.week, { borderTopColor: c.hairline }, styles.weekRow]}>
          {week.map((key) => {
            const inMonth = parseKey(key).m === ym.m;
            const events = byDay.get(key) ?? [];
            const isToday = key === today;
            const isSelected = key === selected;
            const red = dayOfWeek(key) === 0 || Boolean(HOLIDAYS[key]);
            return (
              <Pressable
                key={key}
                onPress={() => onSelect(key)}
                accessibilityLabel={`${formatDayHeading(key)} 일정 ${events.length}개`}
                style={[styles.cell, isSelected && { backgroundColor: c.canvasSoft, borderColor: c.primary }]}>
                <View style={[styles.dayNum, isToday && { backgroundColor: c.primary }]}>
                  <ThemedText
                    type="caption"
                    style={{
                      fontFamily: isToday ? Fonts.bold : Fonts.medium,
                      color: isToday ? c.onPrimary : !inMonth ? c.hairlineInput : red ? c.ruby : c.ink,
                    }}>
                    {parseKey(key).d}
                  </ThemedText>
                </View>
                {inMonth &&
                  events.slice(0, CELL_CHIPS).map((ev) => (
                    <View key={ev.id} style={[styles.cellChip, { backgroundColor: c[EVENT_COLOR[ev.type].soft] }]}>
                      <ThemedText numberOfLines={1} style={[styles.cellChipText, { color: c[EVENT_COLOR[ev.type].fg] }]}>
                        {ev.company.shortName}
                      </ThemedText>
                    </View>
                  ))}
                {inMonth && events.length > CELL_CHIPS && (
                  <ThemedText style={[styles.cellChipText, { color: c.inkMute }]}>+{events.length - CELL_CHIPS}</ThemedText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.four },
  bleed: { marginHorizontal: -Spacing.four },
  chips: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  navBtn: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  navGlyph: { fontSize: 22, lineHeight: 26 },
  todayBtn: { height: 36, borderRadius: Radius.md, paddingHorizontal: Spacing.three, justifyContent: 'center' },
  week: { flexDirection: 'row' },
  weekRow: { borderTopWidth: StyleSheet.hairlineWidth },
  weekday: { flex: 1, textAlign: 'center', paddingBottom: Spacing.two },
  cell: {
    flex: 1,
    minHeight: 70,
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 2,
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: Radius.sm,
  },
  dayNum: { alignSelf: 'center', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cellChip: { borderRadius: 3, paddingHorizontal: 2 },
  cellChipText: { fontFamily: Fonts.semibold, fontSize: 10, lineHeight: 14, textAlign: 'center' },
  dayList: { gap: Spacing.two },
});
