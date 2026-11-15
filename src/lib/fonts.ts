import { Jua } from "next/font/google";

/**
 * 브리핑 제목·썸네일의 둥근 글씨(주아체) — 브리핑 화면 안에서만 jua.className 으로 써요.
 * 사이트의 큰 제목(`font-display`)은 프리텐다드 굵게예요 (globals.css).
 */
export const jua = Jua({ weight: "400", subsets: ["latin"], preload: false, display: "swap", variable: "--font-jua" });
