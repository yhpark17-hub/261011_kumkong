import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useApi } from '@/api/use-api';
import { ThemedText } from '@/components/themed-text';
import { Chip, SectionHeader } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 사이트 /api/app/v1/magazine 응답 */
type MagazineResponse = {
  total: number;
  categories: { key: string; label: string; count: number }[];
  items: {
    id: number;
    categoryLabel: string;
    title: string;
    summary: string[];
    readMinutes: number;
    image: string;
    webUrl: string;
  }[];
};

const openArticle = (id: number, title: string) =>
  router.push({ pathname: '/web', params: { path: `/magazine/${id}`, title } });

/** 금융 블로그(매거진) — 분류 칩 + 왼쪽 제목·오른쪽 썸네일 줄 (DESIGN-MOBILE.md 원칙 4). 글은 웹 화면으로 */
export function MagazineList() {
  const c = useTheme();
  const [category, setCategory] = useState<string | null>(null);
  const { data } = useApi<MagazineResponse>(`/magazine${category ? `?category=${category}` : ''}`);
  const categories = data?.categories.filter((x) => x.count > 0) ?? [];

  return (
    <View style={styles.section}>
      <SectionHeader title="금융 블로그" />
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chips}>
          <Chip label="전체" active={category == null} onPress={() => setCategory(null)} />
          {categories.map((x) => (
            <Chip key={x.key} label={x.label} active={category === x.key} onPress={() => setCategory(category === x.key ? null : x.key)} />
          ))}
        </ScrollView>
      )}
      <View>
        {(data?.items ?? []).slice(0, 12).map((a) => (
          <Pressable key={a.id} onPress={() => openArticle(a.id, a.categoryLabel)} style={[styles.row, { borderBottomColor: c.hairline }]}>
            <View style={styles.flex}>
              <ThemedText type="caption">
                {a.categoryLabel} · {a.readMinutes}분
              </ThemedText>
              <ThemedText type="heading" numberOfLines={3}>
                {a.title}
              </ThemedText>
            </View>
            <Image source={a.image} style={[styles.thumb, { backgroundColor: c.canvasSoft }]} contentFit="cover" transition={150} />
          </Pressable>
        ))}
      </View>
      {data && data.total > 12 && (
        <ThemedText
          type="label"
          themeColor="primaryText"
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/web', params: { path: '/magazine/blog', title: '금융 블로그' } })}>
          글 {data.total}편 전체 보기 ›
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  section: { gap: Spacing.three },
  bleed: { marginHorizontal: -Spacing.four },
  chips: { paddingHorizontal: Spacing.four, gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 104, aspectRatio: 1200 / 630, borderRadius: Radius.md },
});
