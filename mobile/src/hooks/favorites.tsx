import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/** 사이트와 같은 키 이름 — 관심 기관은 이 기기에만 저장 (계정 없음) */
const KEY = 'kumkong:favorites';

type FavoritesValue = {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setIds(parsed.filter((x): x is string => typeof x === 'string'));
      })
      .catch(() => {});
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<FavoritesValue>(() => {
    const favorites = new Set(ids);
    return { favorites, isFavorite: (id) => favorites.has(id), toggle };
  }, [ids, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const v = useContext(FavoritesContext);
  if (!v) throw new Error('FavoritesProvider 안에서만 쓸 수 있어요');
  return v;
}
