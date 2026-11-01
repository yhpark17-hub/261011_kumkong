import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { type CatalogResponse } from '@/api/client';
import { type ApiState, useApi } from '@/api/use-api';
import { buildEvents } from '@/shared/catalog-client';
import type { CalendarEvent, CatalogCompany, CatalogRecruitment } from '@/shared/types';

type CatalogValue = Omit<ApiState<CatalogResponse>, 'data'> & {
  companies: CatalogCompany[];
  recruitments: CatalogRecruitment[];
  events: CalendarEvent[];
  company: (id: string) => CatalogCompany | undefined;
  recruitment: (id: string) => CatalogRecruitment | undefined;
};

const CatalogContext = createContext<CatalogValue | null>(null);

/** 전체 기관·일정을 한 번 받아 모든 화면이 같이 쓴다 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { data, loading, refreshing, error, refresh } = useApi<CatalogResponse>('/catalog');

  const lookup = useMemo(() => {
    const companies = data?.companies ?? [];
    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const recruitmentMap = new Map((data?.recruitments ?? []).map((r) => [r.companyId, r]));
    return {
      companies,
      recruitments: data?.recruitments ?? [],
      events: data ? buildEvents(data) : [],
      company: (id: string) => companyMap.get(id),
      recruitment: (id: string) => recruitmentMap.get(id),
    };
  }, [data]);

  const value = useMemo<CatalogValue>(
    () => ({ ...lookup, loading, refreshing, error, refresh }),
    [lookup, loading, refreshing, error, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogValue {
  const v = useContext(CatalogContext);
  if (!v) throw new Error('CatalogProvider 안에서만 쓸 수 있어요');
  return v;
}
