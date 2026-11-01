import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function CalendarScreen() {
  return (
    <Screen title="채용 캘린더">
      <ComingSoon title="달력" desc="금융공기업·공공기관 서류 마감부터 최종 발표까지 날짜별로 보여 줄게요." />
    </Screen>
  );
}
