import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toKey } from '@/shared/date';

/** 한국 날짜 키 'YYYY-MM-DD' — 한국은 서머타임이 없어 UTC+9로 바로 계산 */
export function todayKST(): string {
  const d = new Date(Date.now() + 9 * 3_600_000);
  return toKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** 자정을 넘기거나 앱으로 돌아오면 다시 계산 */
export function useToday(): string {
  const [today, setToday] = useState(todayKST);

  useEffect(() => {
    const tick = () => setToday(todayKST());
    const timer = setInterval(tick, 60_000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  return today;
}
