import { SymbolView } from 'expo-symbols';
import { TabList, TabListProps, TabSlot, Tabs, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** 웹 미리보기용 하단 탭 (네이티브는 _layout.tsx의 NativeTabs) */
const TABS = [
  { name: 'index', href: '/', label: '홈', icon: 'home' },
  { name: 'calendar', href: '/calendar', label: '캘린더', icon: 'calendar_month' },
  { name: 'reviews', href: '/reviews', label: '필기 후기', icon: 'edit_note' },
  { name: 'news', href: '/news', label: '시사 뉴스', icon: 'newspaper' },
  { name: 'board', href: '/board', label: '콩밭', icon: 'forum' },
] as const;

export default function TabLayout() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <TabBar>
          {TABS.map((t) => (
            <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
              <TabButton icon={t.icon}>{t.label}</TabButton>
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar(props: TabListProps) {
  const c = useTheme();
  return <View {...props} style={[styles.bar, { backgroundColor: c.canvas, borderTopColor: c.hairline }]} />;
}

// ref는 Pressable과 타입이 달라 넘기지 않음 (웹 미리보기 전용이라 필요 없음)
function TabButton({ children, isFocused, icon, ref: _ref, ...props }: TabTriggerSlotProps & { icon: string }) {
  const c = useTheme();
  const color = isFocused ? c.primary : c.inkMute;
  return (
    <Pressable {...props} style={styles.button}>
      <SymbolView name={{ web: icon as never }} size={24} tintColor={color} />
      <ThemedText type="caption" style={{ color }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BottomTabInset,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
