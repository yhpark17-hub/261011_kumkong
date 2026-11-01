import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'title' | 'section' | 'heading' | 'default' | 'read' | 'small' | 'caption' | 'label';
  themeColor?: ThemeColor;
};

const MUTED = new Set(['small', 'caption']);

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (MUTED.has(type) ? 'inkMute' : 'ink')];

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  /** 화면 제목 */
  title: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 32, letterSpacing: -0.5 },
  /** 구역 제목 */
  section: { fontFamily: Fonts.bold, fontSize: 19, lineHeight: 26, letterSpacing: -0.3 },
  /** 목록·카드 제목 */
  heading: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 23 },
  default: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 26 },
  /** 읽는 글 (브리핑·매거진) */
  read: { fontFamily: Fonts.regular, fontSize: 17, lineHeight: 28 },
  small: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: Fonts.medium, fontSize: 12, lineHeight: 16 },
  /** 버튼·칩 글자 */
  label: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 20 },
});
