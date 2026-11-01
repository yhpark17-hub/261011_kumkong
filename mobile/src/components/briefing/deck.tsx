import { openBrowserAsync } from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

import type { AppStory } from '@/api/briefing';
import { Slide } from '@/components/briefing/cards';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { keepAll } from '@/lib/keep-all';

const P = Colors.light;
const GAP = 12;
const pad = (no: number) => String(no).padStart(2, '0');

/**
 * 기사 한 건 카드뉴스 — 옆으로 밀거나 화살표·막대를 눌러 한 장씩 (사이트 CardDeck과 같은 모양).
 * 카드는 화면 폭의 84%, 4:5. 한 묶음 안에서 가장 긴 장에 맞춰 높이가 같아요.
 */
export function Deck({ story, width, onSeen }: { story: AppStory; width: number; onSeen: (id: number) => void }) {
  const ref = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const total = story.slides.length;
  const cardW = Math.round((width - Spacing.four * 2) * 0.84);
  const step = cardW + GAP;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    // 마지막 장은 왼쪽 끝까지 못 오니, 끝까지 밀었으면 마지막 장
    const end = contentOffset.x >= contentSize.width - layoutMeasurement.width - 4;
    const i = end ? total - 1 : Math.min(total - 1, Math.max(0, Math.round(contentOffset.x / step)));
    if (i !== index) setIndex(i);
    if (i === total - 1) onSeen(story.id);
  };
  // 넘기는 중에 또 눌러도 다음 장으로 가게 번호를 먼저 바꿔 둬요
  const go = (i: number) => {
    const to = Math.max(0, Math.min(total - 1, i));
    setIndex(to);
    if (to === total - 1) onSeen(story.id);
    ref.current?.scrollTo({ x: to * step, animated: true });
  };

  return (
    <View accessibilityRole="adjustable" accessibilityLabel={`${pad(story.no)} ${story.title}`}>
      <DeckHead story={story} />

      <View style={styles.progressRow}>
        <View style={styles.progress}>
          {story.slides.map((_, i) => (
            <Pressable key={i} onPress={() => go(i)} accessibilityLabel={`${i + 1}번째 카드`} style={styles.tick} hitSlop={{ top: 8, bottom: 8 }}>
              <View style={[styles.tickBar, { backgroundColor: i <= index ? P.brandDark : 'rgba(28,30,84,0.15)' }]} />
            </Pressable>
          ))}
        </View>
        <Text style={styles.count}>
          <Text style={{ color: P.ink }}>{index + 1}</Text> / {total}
        </Text>
      </View>

      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={32}
        style={styles.bleed}
        contentContainerStyle={styles.track}>
        {story.slides.map((s, i) => (
          <View key={i} style={{ width: cardW, minHeight: Math.round(cardW * 1.25) }} accessibilityLabel={`${i + 1} / ${total}`}>
            <Slide s={s} theme={story.theme} sectionLabel={story.sectionLabel} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={() => openBrowserAsync(story.readMore.url)} style={styles.readMore}>
          <Text style={styles.readMoreText} numberOfLines={1}>
            {story.readMore.label} ↗
          </Text>
        </Pressable>
        <Arrow label="‹" a11y="이전 카드" disabled={index === 0} onPress={() => go(index - 1)} />
        <Arrow label="›" a11y="다음 카드" disabled={index === total - 1} onPress={() => go(index + 1)} />
      </View>
    </View>
  );
}

function Arrow({ label, a11y, disabled, onPress }: { label: string; a11y: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={a11y}
      style={[styles.arrow, disabled && { borderColor: 'rgba(28,30,84,0.15)' }]}>
      <Text style={[styles.arrowText, disabled && { color: 'rgba(28,30,84,0.25)' }]}>{label}</Text>
    </Pressable>
  );
}

/** 기사 머리 — 번호(01·02 …) 옆에 분야와 기사 제목 */
function DeckHead({ story }: { story: AppStory }) {
  return (
    <View style={styles.head}>
      <View style={[styles.no, story.headline ? styles.noHeadline : styles.noPlain]}>
        <Text style={[styles.noText, story.headline && { color: P.onPrimary }]}>{pad(story.no)}</Text>
      </View>
      <View style={styles.headBody}>
        <View style={styles.tags}>
          {story.headline && (
            <View style={[styles.tag, { backgroundColor: P.brandDark }]}>
              <Text style={[styles.tagText, { color: P.onPrimary }]}>오늘의 헤드라인</Text>
            </View>
          )}
          <View style={[styles.tag, { backgroundColor: story.theme.panel }]}>
            <Text style={[styles.tagText, { color: story.theme.deep }]}>{story.sectionLabel}</Text>
          </View>
        </View>
        <Text style={styles.title} lineBreakStrategyIOS="hangul-word">
          {keepAll(story.title)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  no: { marginTop: 2, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  noHeadline: { backgroundColor: P.brandDark },
  noPlain: { borderWidth: 2, borderColor: P.brandDark, backgroundColor: P.canvas },
  noText: { fontFamily: Fonts.bold, fontSize: 16, color: P.brandDark, fontVariant: ['tabular-nums'] },
  headBody: { flex: 1, minWidth: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontFamily: Fonts.semibold, fontSize: 12, lineHeight: 16 },
  title: { marginTop: 4, fontFamily: Fonts.bold, fontSize: 18, lineHeight: 25, letterSpacing: -0.36, color: P.ink },
  progressRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  tick: { flex: 1, paddingVertical: 6 },
  tickBar: { height: 4, borderRadius: 2 },
  count: { fontFamily: Fonts.semibold, fontSize: 12, color: P.inkMute, fontVariant: ['tabular-nums'] },
  bleed: { marginHorizontal: -Spacing.four, marginTop: 4 },
  track: { paddingHorizontal: Spacing.four, gap: GAP, paddingBottom: 4 },
  footer: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  readMore: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderRadius: 999,
    backgroundColor: P.canvasSoft,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  readMoreText: { fontFamily: Fonts.semibold, fontSize: 14, color: P.inkSecondary },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: P.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.canvas,
  },
  arrowText: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 24, color: P.brandDark },
});
