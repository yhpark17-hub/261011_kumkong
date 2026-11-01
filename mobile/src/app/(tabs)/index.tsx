import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';

import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const c = useTheme();

  return (
    <Screen
      title="금콩"
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
      <ComingSoon title="오늘의 브리핑" desc="매일 아침 금콩 브리핑이 여기에 올라와요." />
      <ComingSoon title="관심 기관 일정" desc="★로 고른 기관의 다음 일정과 D-day를 모아 보여 줄게요." />
      <ComingSoon title="임박한 일정" desc="2주 안에 다가오는 서류 마감·필기·면접을 한눈에 볼 수 있어요." />
    </Screen>
  );
}
