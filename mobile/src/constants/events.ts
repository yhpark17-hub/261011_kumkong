import type { ThemeColor } from '@/constants/theme';
import { avatarTone } from '@/shared/meta';
import type { PhaseTone } from '@/shared/schedule';
import type { Blind, EventType } from '@/shared/types';

/** 일정 유형 색 — 사이트 EVENT_META의 ev-* 토큰과 같은 짝 */
export const EVENT_COLOR: Record<EventType, { fg: ThemeColor; soft: ThemeColor }> = {
  posting: { fg: 'evPosting', soft: 'evPostingSoft' },
  doc: { fg: 'evDoc', soft: 'evDocSoft' },
  written: { fg: 'evWritten', soft: 'evWrittenSoft' },
  interview1: { fg: 'evInterview1', soft: 'evInterview1Soft' },
  interview2: { fg: 'evInterview2', soft: 'evInterview2Soft' },
  final: { fg: 'evFinal', soft: 'evFinalSoft' },
};

/** 진행 상태 태그 색 — 사이트 PHASE_TONE_CLASS와 같은 짝 */
export const PHASE_COLOR: Record<PhaseTone, { fg: ThemeColor; bg: ThemeColor }> = {
  open: { fg: 'onPrimary', bg: 'ruby' },
  soon: { fg: 'tagSoftText', bg: 'tagSoftBg' },
  progress: { fg: 'evWritten', bg: 'evWrittenSoft' },
  done: { fg: 'inkMute', bg: 'canvasSoft' },
};

/** 블라인드 태그 색 — 사이트 BLIND_META.tone과 같은 짝 */
export const BLIND_COLOR: Record<Blind, { fg: ThemeColor; bg: ThemeColor }> = {
  full: { fg: 'evFinal', bg: 'evFinalSoft' },
  partial: { fg: 'evInterview2', bg: 'evInterview2Soft' },
  none: { fg: 'inkSecondary', bg: 'canvasSoft' },
  unknown: { fg: 'inkMute', bg: 'canvasSoft' },
};

/** 로고 없는 기관 아바타 배경색 (사이트 avatarTone의 "bg-[#hex]"에서 색만) */
export function avatarColor(id: string): string {
  return avatarTone(id).slice(4, -1);
}
