import { ComingSoon } from '@/components/coming-soon';
import { Screen } from '@/components/screen';

export default function BoardScreen() {
  return (
    <Screen title="콩밭">
      <ComingSoon title="자유 게시판" desc="금공 준비생들의 이야기가 여기에 열려요." />
    </Screen>
  );
}
