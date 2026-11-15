import { Jua } from "next/font/google";

/**
 * 큰 제목용 둥근 글씨 — 브리핑 제목·썸네일과 같은 주아체.
 * variable 로 <html> 에 붙여서 Tailwind `font-display` 로 어디서든 써요 (className 은 브리핑 쪽에서 그대로).
 */
export const jua = Jua({ weight: "400", subsets: ["latin"], preload: false, display: "swap", variable: "--font-jua" });
