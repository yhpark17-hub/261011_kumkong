import AsyncStorage from '@react-native-async-storage/async-storage';

import { SITE_URL } from '@/constants/site';
import type { Catalog, Company, Recruitment } from '@/shared/types';

/** 사이트 src/app/api/app/v1/* 응답 모양 */
export type CatalogResponse = Catalog & { version: string };

export type CompanyDetailResponse = {
  company: Company;
  recruitment: Recruitment;
  alioListed: boolean;
  sameDayWritten: { date: string; companies: { id: string; name: string; shortName: string }[] } | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${SITE_URL}/api/app/v1${path}`);
  if (!res.ok) throw new ApiError(`요청 실패 (${res.status})`, res.status);
  return (await res.json()) as T;
}

/** 마지막으로 받은 응답을 기기에 두고, 다음 실행 때 네트워크보다 먼저 보여 준다 */
const CACHE_PREFIX = 'kumkong:api:';

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 공간이 막혀도 화면은 그대로 동작
  }
}
