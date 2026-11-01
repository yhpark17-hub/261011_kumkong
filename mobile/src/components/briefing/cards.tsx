import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { AppPic, AppSlide, AppText, DeckTheme } from '@/api/briefing';
import { Colors, Fonts } from '@/constants/theme';
import { keepAll } from '@/lib/keep-all';

/**
 * 카드뉴스 한 장 — 사이트 NewsDeck.tsx의 카드 모양을 옮김.
 * 브리핑은 다크 모드에서도 밝은 종이처럼 (사이트 .theme-light와 같음).
 */
const P = Colors.light;
const MUTED_BAR = '#c3ccd9';

/** 글 + (괄호 풀이) — 풀이는 조금 작고 흐리게 */
export function Rich({ text, style }: { text: AppText; style: TextStyle | TextStyle[] }) {
  const size = StyleSheet.flatten(style)?.fontSize ?? 15;
  return (
    <Text style={style} lineBreakStrategyIOS="hangul-word">
      {text.map((p, i) =>
        typeof p === 'string' ? (
          keepAll(p)
        ) : (
          <Text key={i} style={{ fontSize: size * 0.88, fontFamily: Fonts.medium, color: P.inkMute }}>
            ({p.gloss})
          </Text>
        ),
      )}
    </Text>
  );
}

function Pic({ pic, height = '92%' }: { pic: AppPic; height?: `${number}%` }) {
  return (
    <>
      <Image
        source={pic.url}
        style={[styles.pic, { height }]}
        contentFit="contain"
        contentPosition="bottom"
        transition={150}
        accessibilityIgnoresInvertColors
      />
      {pic.credit ? <Text style={styles.credit}>{pic.credit}</Text> : null}
    </>
  );
}

function Kicker({ children, color, style }: { children: string; color: string; style?: object }) {
  return (
    <View style={[styles.kicker, style]}>
      <Text style={[styles.kickerText, { color }]}>{children}</Text>
    </View>
  );
}

/** 카드 위쪽 그림 칸 — 분야 색 바탕 + 이름표 */
function Panel({
  theme,
  kicker,
  ratio = 5 / 3,
  children,
}: {
  theme: DeckTheme;
  kicker?: string;
  ratio?: number;
  children?: ReactNode;
}) {
  return (
    <LinearGradient colors={[theme.panel, '#ffffff']} locations={[0, 1.35]} style={[styles.panel, { aspectRatio: ratio }]}>
      {kicker && <Kicker color={theme.accent}>{kicker}</Kicker>}
      {children}
    </LinearGradient>
  );
}

/** 글이 길면 그림 칸을 낮춰요 (사이트와 같은 기준은 서버가 compact로 알려 줌) */
const panelRatio = (compact: boolean) => (compact ? 5 / 2.3 : 5 / 3);

function Shell({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.shell, style]}>{children}</View>;
}

function Caption({ children }: { children: ReactNode }) {
  return <View style={styles.caption}>{children}</View>;
}

const Head = ({ children }: { children: string }) =>
  children ? (
    <Text style={styles.head} lineBreakStrategyIOS="hangul-word">
      {keepAll(children)}
    </Text>
  ) : null;

export function Slide({ s, theme, sectionLabel }: { s: AppSlide; theme: DeckTheme; sectionLabel: string }) {
  switch (s.kind) {
    case 'cover':
      return <Cover s={s} theme={theme} sectionLabel={sectionLabel} />;
    case 'background':
    case 'text':
      return (
        <Shell>
          <Panel theme={theme} kicker={s.kind === 'background' ? '알고 가기' : '쉽게 말하면'} ratio={panelRatio(s.compact)}>
            <Pic pic={s.pic} />
          </Panel>
          <Caption>
            <Head>{s.title}</Head>
            <Rich text={s.text} style={styles.body} />
          </Caption>
        </Shell>
      );
    case 'stat':
      return (
        <Shell>
          <Panel theme={theme} kicker="숫자로 보기" ratio={panelRatio(s.compact)}>
            <Pic pic={s.pic} />
          </Panel>
          <Caption>
            <Text style={[styles.statValue, { color: theme.accent }]} adjustsFontSizeToFit numberOfLines={1}>
              {s.value}
            </Text>
            <Text style={styles.statLabel} lineBreakStrategyIOS="hangul-word">
              {keepAll(s.label)}
            </Text>
            {s.note.length > 0 && <Rich text={s.note} style={styles.note} />}
          </Caption>
        </Shell>
      );
    case 'bars':
      return (
        <Shell>
          <Panel theme={theme} kicker="비교해 보기" ratio={5 / 3.7}>
            <Bars s={s} theme={theme} />
          </Panel>
          <Caption>
            <Head>{s.title}</Head>
            {s.note.length > 0 && <Rich text={s.note} style={styles.body} />}
          </Caption>
        </Shell>
      );
    case 'change':
      return (
        <Shell>
          <Panel theme={theme} kicker="무엇이 바뀌었나" ratio={5 / 3.7}>
            <Change s={s} theme={theme} />
          </Panel>
          <Caption>
            <Head>{s.title}</Head>
            {s.note.length > 0 && <Rich text={s.note} style={styles.body} />}
          </Caption>
        </Shell>
      );
    case 'flow':
      return (
        <LinearGradient colors={[theme.panel, '#ffffff']} locations={[0, 1.2]} style={styles.shell}>
          <View style={styles.flowHead}>
            <Kicker color={theme.accent} style={styles.inlineKicker}>
              흐름으로 보기
            </Kicker>
            <Head>{s.title}</Head>
          </View>
          <View style={styles.flowList}>
            <View style={[styles.flowLine, { backgroundColor: `${theme.accent}40` }]} />
            {s.steps.map((step, i) => {
              const last = i === s.steps.length - 1;
              return (
                <View key={i} style={styles.flowRow}>
                  <View style={[styles.flowNo, { backgroundColor: last ? theme.deep : theme.accent }]}>
                    <Text style={styles.flowNoText}>{i + 1}</Text>
                  </View>
                  <View style={[styles.flowStep, last ? { backgroundColor: theme.deep } : styles.flowStepPlain]}>
                    <Text style={[styles.flowStepText, last && { color: P.onPrimary }]} lineBreakStrategyIOS="hangul-word">
                      {keepAll(step)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      );
    case 'term':
      return (
        <Shell>
          <Panel theme={theme} kicker="용어 풀이" ratio={panelRatio(s.compact)}>
            <Pic pic={s.pic} />
          </Panel>
          <Caption>
            <View style={[styles.termPill, { backgroundColor: theme.panel }]}>
              <Text style={[styles.termText, { color: theme.deep }]}>{s.term}</Text>
            </View>
            <Rich text={s.text} style={[styles.body, styles.gapTop]} />
          </Caption>
        </Shell>
      );
    case 'quote':
      return (
        <Shell>
          <Panel theme={theme} kicker="한마디" ratio={5 / 3.7}>
            <View style={styles.quotePic}>
              <Pic pic={s.pic} height="100%" />
            </View>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText} lineBreakStrategyIOS="hangul-word">
                “{keepAll(s.text)}”
              </Text>
            </View>
          </Panel>
          <Caption>
            <Head>{s.name}</Head>
            {s.note.length > 0 && <Rich text={s.note} style={styles.body} />}
          </Caption>
        </Shell>
      );
    case 'versus':
      return (
        <Shell>
          <View style={styles.flowHead}>
            <Kicker color={theme.accent} style={[styles.inlineKicker, { backgroundColor: theme.panel }]}>
              둘을 비교
            </Kicker>
            <Head>{s.title}</Head>
          </View>
          <View style={styles.versus}>
            <Side side={s.left} bg="#eef2f7" color="#273951" />
            <View style={styles.vs}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <Side side={s.right} bg={theme.panel} color={theme.deep} />
          </View>
        </Shell>
      );
    case 'summary':
      return (
        <Shell>
          <Panel theme={theme} kicker={s.first ? '무슨 일이에요?' : '조금 더 자세히'}>
            <Pic pic={s.pic} />
          </Panel>
          <Caption>
            <Rich text={s.text} style={styles.long} />
          </Caption>
        </Shell>
      );
    case 'point':
      return (
        <Shell>
          <LinearGradient colors={['#ffe9bf', '#fff7e8']} style={[styles.panel, { aspectRatio: 5 / 2.5 }]}>
            <Kicker color={P.lemon}>왜 중요할까</Kicker>
            <Pic pic={s.pic} height="96%" />
          </LinearGradient>
          <Caption>
            <Text style={styles.pointLabel}>필기·면접 포인트</Text>
            <Rich text={s.text} style={[styles.long, styles.gapTopSm]} />
          </Caption>
        </Shell>
      );
  }
}

function Side({ side, bg, color }: { side: { name: string; text: AppText }; bg: string; color: string }) {
  return (
    <View style={[styles.side, { backgroundColor: bg }]}>
      <Text style={[styles.sideName, { color }]} lineBreakStrategyIOS="hangul-word">
        {keepAll(side.name)}
      </Text>
      <Rich text={side.text} style={styles.sideText} />
    </View>
  );
}

function Cover({ s, theme, sectionLabel }: { s: Extract<AppSlide, { kind: 'cover' }>; theme: DeckTheme; sectionLabel: string }) {
  return (
    <LinearGradient colors={[theme.deep, theme.accent]} start={{ x: 0.3, y: 0 }} end={{ x: 0.9, y: 1.4 }} style={styles.shell}>
      <View style={[styles.coverArt]}>
        {s.photo ? (
          <>
            <Image source={s.photo.url} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            {s.photo.credit ? <Text style={[styles.credit, styles.photoCredit]}>사진 · {s.photo.credit}</Text> : null}
          </>
        ) : s.pic ? (
          <Pic pic={s.pic} height="94%" />
        ) : null}
        <View style={styles.sectionPill}>
          <Text style={styles.sectionPillText}>{sectionLabel}</Text>
        </View>
        {s.org && (
          <View style={styles.orgPill}>
            {s.org.logo ? <Image source={s.org.logo} style={styles.orgLogo} contentFit="contain" /> : null}
            <Text style={styles.orgName}>{s.org.name}</Text>
          </View>
        )}
      </View>
      <View style={styles.coverCaption}>
        <Rich text={s.text} style={styles.coverText} />
        <Text style={styles.coverHint}>카드 {s.total}장 · 옆으로 넘겨 보세요 ›</Text>
      </View>
    </LinearGradient>
  );
}

/** 세로 막대 비교 — 돈이면 동전 탑(서버가 그린 SVG), 아니면 둥근 막대. 높이는 서버가 계산 */
function Bars({ s, theme }: { s: Extract<AppSlide, { kind: 'bars' }>; theme: DeckTheme }) {
  const valueSize = s.bars.length >= 4 ? 11 : s.bars.length === 3 ? 12 : 14;
  return (
    <View style={styles.chart}>
      {s.bars.map((b, i) => (
        <View key={i} style={styles.barCol}>
          <View style={styles.barArea}>
            {b.coins ? (
              <SvgXml xml={b.coins} width="100%" height="100%" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[styles.bar, { height: `${b.top}%`, backgroundColor: b.strong ? theme.accent : MUTED_BAR }]} />
            )}
            <Text
              style={[styles.barValue, { bottom: `${b.top}%`, fontSize: valueSize, color: b.strong ? theme.deep : P.inkMute }]}>
              {b.value}
            </Text>
          </View>
          <Text style={[styles.barLabel, b.strong ? styles.barLabelStrong : null]} lineBreakStrategyIOS="hangul-word">
            {keepAll(b.label)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** 전 → 후 — 줄마다 두 막대(전 회색 · 후 분야색)와 오름·내림 */
function Change({ s, theme }: { s: Extract<AppSlide, { kind: 'change' }>; theme: DeckTheme }) {
  const one = s.rows.length === 1;
  const bar = (pct: number, label: string, after: boolean) => (
    <View style={[styles.changeBar, one ? styles.changeBarOne : null]}>
      <View style={[styles.changeFill, { height: `${pct}%`, backgroundColor: after ? theme.accent : MUTED_BAR }]} />
      <Text
        style={[
          styles.barValue,
          { bottom: `${pct}%`, color: after ? theme.deep : P.inkMute, fontSize: one ? (after ? 17 : 14) : after ? 12 : 10.5 },
        ]}>
        {label}
      </Text>
    </View>
  );
  return (
    <View style={styles.chart}>
      {s.rows.map((r, i) => (
        <View key={i} style={styles.barCol}>
          {r.dir !== 0 ? (
            <View style={[styles.dir, { backgroundColor: r.dir > 0 ? P.ruby : '#2f6fd6' }]}>
              <Text style={styles.dirText}>{r.dir > 0 ? '▲ 오름' : '▼ 내림'}</Text>
            </View>
          ) : null}
          <View style={styles.changePair}>
            {bar(r.fromPct, r.from, false)}
            {bar(r.toPct, r.to, true)}
          </View>
          <Text style={[styles.barLabel, styles.barLabelStrong]} lineBreakStrategyIOS="hangul-word">
            {keepAll(r.label)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: P.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(28,30,84,0.08)',
  },
  panel: { width: '100%', overflow: 'hidden' },
  pic: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  credit: {
    position: 'absolute',
    right: 8,
    bottom: 4,
    fontSize: 9,
    color: P.inkMute,
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  photoCredit: { color: P.onPrimary, backgroundColor: 'rgba(28,30,84,0.5)' },
  kicker: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inlineKicker: { position: 'relative', top: 0, left: 0, alignSelf: 'flex-start' },
  kickerText: { fontFamily: Fonts.bold, fontSize: 12, lineHeight: 16 },
  caption: { flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  head: { fontFamily: Fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4, color: P.ink },
  body: { marginTop: 8, fontFamily: Fonts.regular, fontSize: 15, lineHeight: 25, color: P.inkSecondary },
  long: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 25.5, color: P.ink },
  note: { marginTop: 6, fontFamily: Fonts.regular, fontSize: 14, lineHeight: 23, color: P.inkSecondary },
  gapTop: { marginTop: 12 },
  gapTopSm: { marginTop: 6 },
  statValue: { fontFamily: Fonts.bold, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  statLabel: { marginTop: 8, fontFamily: Fonts.bold, fontSize: 17, lineHeight: 23, color: P.ink },
  termPill: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  termText: { fontFamily: Fonts.bold, fontSize: 21, lineHeight: 29 },
  pointLabel: { fontFamily: Fonts.bold, fontSize: 13, lineHeight: 18, color: P.lemon },
  flowHead: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
  flowList: { flex: 1, justifyContent: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  flowLine: { position: 'absolute', left: 33, top: 24, bottom: 32, width: 2, borderRadius: 1 },
  flowRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flowNo: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  flowNoText: { fontFamily: Fonts.bold, fontSize: 13, color: P.onPrimary },
  flowStep: { flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  flowStepPlain: {
    backgroundColor: P.canvas,
    shadowColor: '#1c1e54',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  flowStepText: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 20, color: P.ink },
  quotePic: { position: 'absolute', right: 0, bottom: 0, width: '52%', height: '92%' },
  bubble: {
    position: 'absolute',
    top: 48,
    left: 12,
    maxWidth: '58%',
    backgroundColor: P.canvas,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#1c1e54',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bubbleText: { fontFamily: Fonts.bold, fontSize: 17, lineHeight: 22, color: P.ink },
  versus: { flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  side: { flex: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 16 },
  sideName: { fontFamily: Fonts.bold, fontSize: 19, lineHeight: 23 },
  sideText: { marginTop: 10, fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22, color: P.inkSecondary },
  vs: {
    alignSelf: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: { fontFamily: Fonts.bold, fontSize: 11, color: P.onPrimary },
  coverArt: { width: '100%', aspectRatio: 5 / 3, overflow: 'hidden' },
  orgPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.canvas,
    borderRadius: 999,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 10,
  },
  sectionPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(28,30,84,0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionPillText: { fontFamily: Fonts.bold, fontSize: 12, lineHeight: 16, color: P.onPrimary },
  orgLogo: { width: 20, height: 20, borderRadius: 10 },
  orgName: { fontFamily: Fonts.bold, fontSize: 12, color: P.brandDark },
  coverCaption: { flex: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  coverText: { fontFamily: Fonts.bold, fontSize: 19, lineHeight: 27, letterSpacing: -0.4, color: P.onPrimary },
  coverHint: { marginTop: 'auto', paddingTop: 12, fontFamily: Fonts.semibold, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  chart: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 44,
    bottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 6,
  },
  barCol: { flex: 1, minWidth: 0, alignItems: 'center', paddingTop: 20 },
  barArea: { flex: 1, width: '100%' },
  bar: { position: 'absolute', bottom: 0, alignSelf: 'center', width: '58%', maxWidth: 46, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  // 숫자는 막대보다 넓어도 한 줄로 (사이트 whitespace-nowrap)
  barValue: {
    position: 'absolute',
    left: -48,
    right: -48,
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontVariant: ['tabular-nums'],
  },
  barLabel: { marginTop: 6, textAlign: 'center', fontFamily: Fonts.regular, fontSize: 12, lineHeight: 15, color: P.inkSecondary },
  barLabelStrong: { fontFamily: Fonts.bold, color: P.ink },
  dir: { marginBottom: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  dirText: { fontFamily: Fonts.bold, fontSize: 11, color: P.onPrimary },
  changePair: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, paddingTop: 20 },
  changeBar: { height: '100%', width: '36%', maxWidth: 44 },
  changeBarOne: { width: '30%', maxWidth: 72 },
  changeFill: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
});
