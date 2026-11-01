import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { SITE_URL } from '@/constants/site';
import { useFavorites } from '@/hooks/favorites';
import type { EventType } from '@/shared/types';

/**
 * 관심 기관 일정 알림 — 전날 오전 9시·당일 오전 8시 (사이트 크론이 보냄, 사이트 src/lib/server/app-push.ts).
 * 이 기기의 푸시 토큰 + 관심 기관 + 설정만 사이트에 보내요 (계정 없음). 알림을 끄면 서버에서도 지워요.
 */
export const ALERT_TYPES: { types: EventType[]; label: string }[] = [
  { types: ['doc'], label: '서류 마감' },
  { types: ['written'], label: '필기' },
  { types: ['interview1', 'interview2'], label: '면접' },
  { types: ['final'], label: '최종 발표' },
];

export type AlertPrefs = { enabled: boolean; d1: boolean; d0: boolean; types: EventType[]; asked: boolean };
const DEFAULT_PREFS: AlertPrefs = {
  enabled: false,
  d1: true,
  d0: true,
  types: ALERT_TYPES.flatMap((t) => t.types),
  asked: false,
};

const KEY = 'kumkong:alerts';
const SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';
export type Permission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

// 앱을 보는 중에 온 알림도 위에 띄워요
if (SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

type AlertsValue = {
  prefs: AlertPrefs;
  permission: Permission;
  /** 토큰을 못 받은 까닭 (EAS 프로젝트가 없거나 네트워크) */
  error: string | null;
  /** 알림 켜기 — 권한을 묻고 허락하면 서버에 등록 */
  enable: () => Promise<Permission>;
  disable: () => void;
  update: (p: Partial<Pick<AlertPrefs, 'd1' | 'd0' | 'types'>>) => void;
  markAsked: () => void;
  sendTest: () => Promise<string>;
};

const AlertsContext = createContext<AlertsValue | null>(null);

async function api(path: string, method: 'POST' | 'DELETE', body: unknown) {
  const res = await fetch(`${SITE_URL}/api/app/v1${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? `요청 실패 (${res.status})`);
}

async function readPermission(): Promise<Permission> {
  if (!SUPPORTED) return 'unsupported';
  const p = await Notifications.getPermissionsAsync();
  return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
}

async function pushToken(): Promise<string> {
  // Android 13+ 는 채널이 있어야 권한 창이 떠요
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: '관심 기관 일정',
      importance: AndroidImportance.HIGH,
    });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('앱 빌드 설정(EAS 프로젝트)이 아직 없어요');
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const { favorites } = useFavorites();
  const [prefs, setPrefs] = useState<AlertPrefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const [permission, setPermission] = useState<Permission>(SUPPORTED ? 'undetermined' : 'unsupported');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setLoaded(true));
    readPermission().then(setPermission).catch(() => {});
  }, []);

  const save = useCallback((next: AlertPrefs) => {
    setPrefs(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // 켜져 있고 권한이 있으면 토큰을 받아 둬요
  useEffect(() => {
    if (!loaded || !prefs.enabled || permission !== 'granted' || token) return;
    pushToken()
      .then((t) => {
        setToken(t);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [loaded, prefs.enabled, permission, token]);

  // 관심 기관·설정이 바뀌면 서버에 알려요 (잠깐 모아서 한 번)
  const favoriteIds = useMemo(() => [...favorites].sort().join(','), [favorites]);
  const lastSent = useRef('');
  useEffect(() => {
    if (!loaded || !token) return;
    const payload = prefs.enabled
      ? { token, platform: Platform.OS, favorites: favoriteIds ? favoriteIds.split(',') : [], prefs: { d1: prefs.d1, d0: prefs.d0, types: prefs.types } }
      : { token };
    const sig = JSON.stringify(payload);
    if (sig === lastSent.current) return;
    const timer = setTimeout(() => {
      api('/devices', prefs.enabled ? 'POST' : 'DELETE', payload)
        .then(() => {
          lastSent.current = sig;
          setError(null);
        })
        .catch((e: Error) => setError(e.message));
    }, 1500);
    return () => clearTimeout(timer);
  }, [loaded, token, prefs, favoriteIds]);

  const enable = useCallback(async (): Promise<Permission> => {
    if (!SUPPORTED) return 'unsupported';
    let p = await readPermission();
    if (p === 'undetermined') {
      const r = await Notifications.requestPermissionsAsync();
      p = r.granted ? 'granted' : r.canAskAgain ? 'undetermined' : 'denied';
    }
    setPermission(p);
    save({ ...prefs, enabled: p === 'granted', asked: true });
    return p;
  }, [prefs, save]);

  const value = useMemo<AlertsValue>(
    () => ({
      prefs,
      permission,
      error,
      enable,
      disable: () => save({ ...prefs, enabled: false, asked: true }),
      update: (p) => save({ ...prefs, ...p }),
      markAsked: () => save({ ...prefs, asked: true }),
      sendTest: async () => {
        if (!token) throw new Error(error ?? '아직 이 기기가 등록되지 않았어요');
        await api('/devices/test', 'POST', { token });
        return '테스트 알림을 보냈어요. 잠시 뒤 도착해요.';
      },
    }),
    [prefs, permission, error, enable, save, token],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts(): AlertsValue {
  const v = useContext(AlertsContext);
  if (!v) throw new Error('AlertsProvider 안에서만 쓸 수 있어요');
  return v;
}
