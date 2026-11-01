import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useCatalog } from '@/api/catalog';
import { ComingSoon } from '@/components/coming-soon';
import { openCompany, UrgentCard } from '@/components/events';
import { LoadState, Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Card, CompanyAvatar, DDayBadge, EventTag, SectionHeader, Tag } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/hooks/favorites';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { favoritesNext, newPostings, urgentEvents } from '@/lib/lists';
import { formatRange, formatShort } from '@/shared/date';

export default function HomeScreen() {
  const c = useTheme();
  const today = useToday();
  const catalog = useCatalog();
  const { favorites } = useFavorites();
  const ready = catalog.companies.length > 0;

  return (
    <Screen
      title="금콩"
      refreshing={catalog.refreshing}
      onRefresh={catalog.refresh}
      right={
        <Link href="/settings" asChild>
          <Pressable accessibilityLabel="설정" hitSlop={12}>
            <SymbolView
              name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
              size={24}
              tintColor={c.inkMute}
            />
          </Pressable>
        </Link>
      }>
      {!ready ? (
        <LoadState loading={catalog.loading} error={catalog.error} onRetry={catalog.refresh} />
      ) : (
        <>
          <Favorites today={today} ids={favorites} />
          <Urgent today={today} />
          <NewPostings today={today} />
          <ComingSoon title="오늘의 브리핑" desc="매일 아침 금콩 브리핑이 여기에 올라와요." />
        </>
      )}
    </Screen>
  );
}

function Favorites({ today, ids }: { today: string; ids: Set<string> }) {
  const { company, recruitment } = useCatalog();
  const rows = favoritesNext(ids, company, recruitment, today);

  return (
    <View style={styles.section}>
      <SectionHeader title="관심 기관" href="/companies" more="전체 기관" />
      {rows.length === 0 ? (
        <Card>
          <ThemedText type="small">기관 이름 옆 ☆를 누르면 다음 일정과 D-day를 여기에 모아 보여 줘요.</ThemedText>
        </Card>
      ) : (
        <View>
          {rows.map(({ company: co, recruitment: r, next }) => (
            <Pressable key={co.id} onPress={() => openCompany(co.id)} style={styles.favRow}>
              <CompanyAvatar company={co} />
              <View style={styles.flex}>
                <ThemedText type="heading" numberOfLines={1}>
                  {co.name}
                </ThemedText>
                {next ? (
                  <View style={styles.inline}>
                    <EventTag type={next.type} label={next.label} />
                    <ThemedText type="small" themeColor="inkSecondary" numberOfLines={1} style={styles.flex}>
                      {formatRange(next.date, next.endDate)}
                      {next.time ? ` ${next.time}` : ''}
                      {r?.status === 'expected' ? ' · 예상' : ''}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText type="small">{r?.events.length ? '이번 전형이 끝났어요' : '공고 확인 중'}</ThemedText>
                )}
              </View>
              {next && <DDayBadge today={today} date={next.date} endDate={next.endDate} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function Urgent({ today }: { today: string }) {
  const { events } = useCatalog();
  const { list, counts, windowDays } = urgentEvents(events, today);

  return (
    <View style={styles.section}>
      <SectionHeader title="임박한 일정" href="/calendar" more="캘린더" />
      <View style={styles.pills}>
        <Tag fg="onPrimary" bg="ruby">{`오늘 ${counts.today}`}</Tag>
        <Tag fg="inkSecondary" bg="canvasSoft">{`7일 내 서류마감 ${counts.doc}`}</Tag>
        <Tag fg="inkSecondary" bg="canvasSoft">{`7일 내 필기 ${counts.written}`}</Tag>
      </View>
      {list.length === 0 ? (
        <Card>
          <ThemedText type="small">{windowDays}일 안에 예정된 일정이 없어요. 캘린더에서 다음 달 일정을 확인해 보세요.</ThemedText>
        </Card>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.strip}>
          {list.map((ev) => (
            <UrgentCard key={ev.id} ev={ev} today={today} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function NewPostings({ today }: { today: string }) {
  const { company, recruitments } = useCatalog();
  const c = useTheme();
  const rows = newPostings(recruitments, company, today).slice(0, 8);
  if (!rows.length) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="새로 뜬 공고" />
      <View style={[styles.postings, { borderColor: c.hairline }]}>
        {rows.map((p, i) => (
          <Pressable
            key={p.company.id}
            onPress={() => openCompany(p.company.id)}
            style={[styles.postingRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.hairline }]}>
            <View style={styles.flex}>
              <View style={styles.inline}>
                {p.fresh && <Tag fg="onPrimary" bg="ruby">NEW</Tag>}
                <ThemedText type="heading" numberOfLines={1} style={styles.flex}>
                  {p.company.name}
                </ThemedText>
              </View>
              <ThemedText type="caption" numberOfLines={1}>
                {p.title}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="inkSecondary" style={styles.tabular}>
              {p.docDate ? `${formatShort(p.docDate)}${p.docTime ? ` ${p.docTime}` : ''} 마감` : `${formatShort(p.postedOn)} 공고`}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabular: { fontVariant: ['tabular-nums'] },
  section: { gap: Spacing.three },
  inline: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  favRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  bleed: { marginHorizontal: -Spacing.four },
  strip: { paddingHorizontal: Spacing.four, gap: Spacing.three },
  postings: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.lg, paddingHorizontal: Spacing.four },
  postingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
});
