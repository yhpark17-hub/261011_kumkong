import { ADSENSE_CLIENT } from "@/lib/site";

/** AdSense 승인에 필요한 /ads.txt — 환경변수의 퍼블리셔 ID로 자동 생성합니다. */
export function GET() {
  const pub = ADSENSE_CLIENT.replace(/^ca-/, "");
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : "# NEXT_PUBLIC_ADSENSE_CLIENT 환경변수에 AdSense 퍼블리셔 ID를 설정하세요.\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
