import { ALLOWED_TYPES, extOf } from "@/lib/attachments";
import { readLocalFile } from "@/lib/server/storage";

/** 로컬 개발용 업로드 파일 제공 (배포에서는 Vercel Blob 주소를 바로 씁니다) */
export async function GET(_req: Request, { params }: RouteContext<"/api/files/[...path]">) {
  const { path } = await params;
  const key = path.join("/");
  if (!/^(board|magazine)\/\d{8}\/[a-f0-9]{24}\.[a-z0-9]{1,5}$/.test(key)) return new Response(null, { status: 404 });
  const data = await readLocalFile(key);
  const type = ALLOWED_TYPES[extOf(key)];
  if (!data || !type) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "content-type": type.mime,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      // 사진이 아닌 파일은 브라우저에서 열지 않고 내려받기
      ...(type.kind === "file" ? { "content-disposition": "attachment" } : {}),
    },
  });
}
