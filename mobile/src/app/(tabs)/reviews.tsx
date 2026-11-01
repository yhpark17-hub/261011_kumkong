import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function ReviewsScreen() {
  return (
    <Screen title="필기 후기">
      <ComingSoon title="시험별 후기" desc="응시자 후기와 실시간 응시자 톡이 여기에 열려요." />
    </Screen>
  );
}
