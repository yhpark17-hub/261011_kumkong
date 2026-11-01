import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * 차단한 글쓴이 — 사이트 글·댓글·후기·톡에 붙은 글쓴이 열쇠(data-ak, 12자).
 * 이 기기에만 저장하고, 웹 화면을 열 때마다 그 글쓴이의 글을 가리는 스타일을 넣어요 (Apple 심사 1.2).
 */
const KEY = 'kumkong:blocked';
const AUTHOR = /^[0-9a-f]{12}$/;

type BlocksValue = {
  blocked: string[];
  block: (author: string) => void;
  clear: () => void;
};

const BlocksContext = createContext<BlocksValue | null>(null);

export function BlocksProvider({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) setBlocked(parsed.filter((x): x is string => typeof x === 'string' && AUTHOR.test(x)));
      })
      .catch(() => {});
  }, []);

  const save = (next: string[]) => AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});

  const block = useCallback((author: string) => {
    if (!AUTHOR.test(author)) return;
    setBlocked((prev) => {
      if (prev.includes(author)) return prev;
      const next = [...prev, author];
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setBlocked([]);
    save([]);
  }, []);

  const value = useMemo(() => ({ blocked, block, clear }), [blocked, block, clear]);
  return <BlocksContext.Provider value={value}>{children}</BlocksContext.Provider>;
}

export function useBlocks(): BlocksValue {
  const v = useContext(BlocksContext);
  if (!v) throw new Error('BlocksProvider 안에서만 쓸 수 있어요');
  return v;
}

/** 차단한 글쓴이의 글을 '차단한 사용자의 글이에요' 한 줄로 바꾸는 CSS */
export function blockedCss(authors: string[]): string {
  if (!authors.length) return '';
  const sel = (suffix: string) => authors.map((a) => `[data-ak="${a}"]${suffix}`).join(',');
  return (
    `${sel('>*')}{display:none!important}` +
    `${sel('::before')}{content:"차단한 사용자의 글이에요";display:block;padding:12px 0;font-size:13px;color:#64748d}`
  );
}
