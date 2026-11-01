import { useCallback, useEffect, useState } from 'react';

import { fetchApi, readCache, writeCache } from '@/api/client';

export type ApiState<T> = {
  data: T | null;
  /** 저장해 둔 값도 없이 처음 불러오는 중 */
  loading: boolean;
  /** 당겨서 새로고침 중 */
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type Entry<T> = { path: string; data: T | null; loading: boolean; error: string | null };

const blank = <T,>(path: string): Entry<T> => ({ path, data: null, loading: true, error: null });

/** 기기에 저장한 응답을 먼저 보여 주고, 곧바로 서버에서 새로 받아 바꾼다 */
export function useApi<T>(path: string): ApiState<T> {
  const [entry, setEntry] = useState<Entry<T>>(() => blank(path));
  const [refreshing, setRefreshing] = useState(false);
  // 주소가 바뀌면 이전 주소의 값은 버리고 새로 불러오는 중으로 본다
  const view = entry.path === path ? entry : blank<T>(path);

  const load = useCallback(async (p: string, alive: () => boolean) => {
    try {
      const fresh = await fetchApi<T>(p);
      if (!alive()) return;
      setEntry({ path: p, data: fresh, loading: false, error: null });
      writeCache(p, fresh);
    } catch {
      if (!alive()) return;
      setEntry((prev) => ({ ...(prev.path === p ? prev : blank<T>(p)), loading: false, error: '인터넷 연결을 확인해 주세요.' }));
    }
  }, []);

  useEffect(() => {
    let alive = true;
    readCache<T>(path).then((cached) => {
      if (!alive) return;
      if (cached) setEntry({ path, data: cached, loading: false, error: null });
      return load(path, () => alive);
    });
    return () => {
      alive = false;
    };
  }, [path, load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(path, () => true);
    setRefreshing(false);
  }, [path, load]);

  return { data: view.data, loading: view.loading, refreshing, error: view.error, refresh };
}
