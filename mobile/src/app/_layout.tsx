import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { CatalogProvider } from '@/api/catalog';
import { Colors, FONT_FILES, Fonts } from '@/constants/theme';
import { FavoritesProvider } from '@/hooks/favorites';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: c.primary, background: c.canvas, card: c.canvas, text: c.ink, border: c.hairline },
  };

  return (
    <ThemeProvider value={navTheme}>
      <CatalogProvider>
        <FavoritesProvider>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerTintColor: c.primaryText,
              headerTitleStyle: { fontFamily: Fonts.bold, color: c.ink },
              headerBackButtonDisplayMode: 'minimal',
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="companies" options={{ title: '기관 정보' }} />
            <Stack.Screen name="company/[id]" options={{ title: '' }} />
            <Stack.Screen name="settings" options={{ title: '설정' }} />
          </Stack>
        </FavoritesProvider>
      </CatalogProvider>
    </ThemeProvider>
  );
}
