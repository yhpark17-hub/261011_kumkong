import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/** 알림이 여는 앱 화면 — 사이트가 보내는 data.path (사이트 src/lib/server/app-push.ts composeMessage) */
const ALLOWED = /^\/(?:company\/[\w-]+|calendar)?$/;

function Router() {
  // 앱이 꺼져 있다가 알림으로 열린 경우까지 — 마지막으로 누른 알림
  const last = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!last || last.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const path = last.notification.request.content.data?.path;
    if (typeof path === 'string' && ALLOWED.test(path)) router.push(path as Href);
  }, [last]);
  return null;
}

/** 알림을 누르면 그 기관 화면(또는 캘린더)으로 — Stack 안에 그려서 화면이 준비된 뒤에 이동해요 */
export function NotificationRouter() {
  return Platform.OS === 'ios' || Platform.OS === 'android' ? <Router /> : null;
}
