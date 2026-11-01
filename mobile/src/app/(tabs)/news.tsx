import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function NewsScreen() {
  return (
    <Screen title="시사 뉴스">
      <ComingSoon title="금콩 브리핑" desc="아침 카드뉴스와 지난 브리핑을 넘겨 볼 수 있어요." />
      <ComingSoon title="매거진" desc="필기·면접·기관 딥다이브 글이 여기에 모여요." />
    </Screen>
  );
}
