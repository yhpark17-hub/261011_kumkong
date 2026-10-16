import { ALLOWED_TYPES, extOf } from "@/lib/attachments";
import { readStoredFile } from "@/lib/server/storage";

/** 올린 파일 보여 주기 — 로컬 개발(data/uploads)과 배포의 비공개 Blob 저장소 파일을 우리 주소로 */
export async function GET(_req: Request, { params }: RouteContext<"/api/files/[...path]">) {
  const { path } = await params;
  const key = path.join("/");
  const type = ALLOWED_TYPES[extOf(key)];
  if (!type) return new Response(null, { status: 404 });
  const data = await readStoredFile(key);
  if (!data) return new Response(null, { status: 404 });
  return new Response(data, {
    headers: {
      "content-type": type.mime,
      // 파일 주소는 매번 새로 만들어져 내용이 바뀌지 않으니 브라우저·CDN 에 오래 저장
      "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "x-content-type-options": "nosniff",
      // 사진이 아닌 파일은 브라우저에서 열지 않고 내려받기
      ...(type.kind === "file" ? { "content-disposition": "attachment" } : {}),
    },
  });
}
