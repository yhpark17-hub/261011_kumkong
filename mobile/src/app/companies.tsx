import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCatalog } from '@/api/catalog';
import { openCompany } from '@/components/events';
import { LoadState } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Chip, CompanyAvatar, FavoriteStar, PhaseTag } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useFavorites } from '@/hooks/favorites';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { formatRatio } from '@/shared/format';
import { CATEGORY_META, CATEGORY_ORDER } from '@/shared/meta';
import { recruitmentPhase } from '@/shared/schedule';
import type { Category } from '@/shared/types';

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

export default function CompaniesScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const catalog = useCatalog();
  const { favorites } = useFavorites();
  const [query, setQuery] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);

  const rows = useMemo(() => {
    const q = normalize(query);
    return catalog.companies
      .filter((co) => {
        if (favOnly && !favorites.has(co.id)) return false;
        if (category && co.category !== category) return false;
        return !q || normalize(`${co.name}${co.shortName}`).includes(q);
      })
      .sort(
        (a, b) =>
          CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.name.localeCompare(b.name, 'ko'),
      );
  }, [catalog.companies, query, favOnly, favorites, category]);

  if (catalog.companies.length === 0) {
    return (
      <ThemedView style={styles.fill}>
        <LoadState loading={catalog.loading} error={catalog.error} onRetry={catalog.refresh} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.fill}>
      <FlatList
        data={rows}
        keyExtractor={(co) => co.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="기관 이름으로 찾기"
              placeholderTextColor={c.inkMute}
              clearButtonMode="while-editing"
              returnKeyType="search"
              style={[styles.search, { backgroundColor: c.canvasSoft, color: c.ink }]}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
              <Chip label={`★ 관심 ${favorites.size}`} active={favOnly} onPress={() => setFavOnly((v) => !v)} />
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
            <ThemedText type="caption">{`${rows.length}곳`}</ThemedText>
          </View>
        }
        ListEmptyComponent={
          <ThemedText type="small" style={styles.empty}>
            {favOnly && favorites.size === 0 ? '아직 고른 관심 기관이 없어요. 기관 옆 ☆를 눌러 보세요.' : '찾는 기관이 없어요.'}
          </ThemedText>
        }
        renderItem={({ item: co }) => {
          const r = catalog.recruitment(co.id);
          const phase = r ? recruitmentPhase(r, today) : null;
          return (
            <Pressable onPress={() => openCompany(co.id)} style={[styles.row, { borderBottomColor: c.hairline }]}>
              <CompanyAvatar company={co} />
              <View style={styles.flex}>
                <ThemedText type="heading" numberOfLines={1}>
                  {co.name}
                </ThemedText>
                <View style={styles.meta}>
                  {phase && <PhaseTag label={phase.label} tone={phase.tone} />}
                  <ThemedText type="caption" numberOfLines={1} style={styles.flex}>
                    {CATEGORY_META[co.category].label}
                    {co.ratio ? ` · 경쟁률 ${formatRatio(co.ratio.value)}` : ''}
                  </ThemedText>
                </View>
              </View>
              <FavoriteStar companyId={co.id} />
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: Spacing.four },
  header: { gap: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  search: {
    height: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.four,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  bleed: { marginHorizontal: -Spacing.four },
  chips: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 2 },
  empty: { textAlign: 'center', paddingVertical: Spacing.six },
});
