import { Platform } from 'react-native';

/**
 * 한글 낱말 가운데서 줄이 바뀌지 않게 (사이트 word-break: keep-all).
 * iOS는 Text의 lineBreakStrategyIOS="hangul-word"로 되지만 Android·웹은 그런 설정이 없어서,
 * 한글 글자 사이에 보이지 않는 '붙여 쓰기' 문자(U+2060)를 넣어 띄어쓰기에서만 줄이 바뀌게 해요.
 */
const BETWEEN_HANGUL = /([가-힣])(?=[가-힣])/g;

export const keepAll = (s: string): string => (Platform.OS === 'ios' ? s : s.replace(BETWEEN_HANGUL, '$1⁠'));
