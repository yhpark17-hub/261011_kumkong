import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="tabular type-display-xxl text-primary-text">404</p>
      <h1 className="mt-4 type-heading-lg text-ink">페이지를 찾을 수 없어요</h1>
      <p className="mt-3 text-ink-mute">주소가 바뀌었거나 삭제된 페이지일 수 있어요.</p>
      <Link href="/calendar" className="btn btn-primary mt-8">
        채용 캘린더로 가기
      </Link>
    </div>
  );
}
