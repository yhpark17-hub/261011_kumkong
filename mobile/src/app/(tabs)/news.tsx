import { StyleSheet, View } from 'react-native';

import type { BriefingListResponse } from '@/api/briefing';
import { useApi } from '@/api/use-api';
import { IssueHero, IssueRow } from '@/components/briefing/issue-card';
import { MagazineList } from '@/components/magazine-list';
import { LoadState, Screen } from '@/components/screen';
import { SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export default function NewsScreen() {
  const list = useApi<BriefingListResponse>('/briefings');
  const items = list.data?.items ?? [];
  const morning = items.find((i) => i.edition === 'morning');
  const noon = items.find((i) => i.edition === 'noon');
  const rest = items.filter((i) => i !== morning && i !== noon).slice(0, 12);

  return (
    <Screen title="시사 뉴스" refreshing={list.refreshing} onRefresh={list.refresh}>
      {!list.data ? (
        <LoadState loading={list.loading} error={list.error} onRetry={list.refresh} />
      ) : (
        <>
          {morning && (
            <View style={styles.section}>
              <SectionHeader title="오늘의 브리핑" />
              <IssueHero issue={morning} />
            </View>
          )}
          {noon && (
            <View style={styles.section}>
              <SectionHeader title="금콩 스터디" />
              <IssueRow issue={noon} />
            </View>
          )}
          {rest.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="지난 브리핑" />
              <View>
                {rest.map((i) => (
                  <IssueRow key={i.id} issue={i} />
                ))}
              </View>
            </View>
          )}
        </>
      )}
      <MagazineList />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
});
