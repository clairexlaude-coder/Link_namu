import Link from "next/link";
import { profiles } from "@/data/profiles";
import { editable } from "@/lib/editable";

const FILE = "src/app/page.tsx";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <p {...editable("로고", FILE)} className="text-4xl">🌳</p>
      <h1 {...editable("서비스 제목", FILE)} className="mt-4 text-3xl font-bold">링크나무</h1>
      <p {...editable("서비스 소개", FILE)} className="mt-3 text-muted">
        내 모든 링크를 한 페이지에 모아두고, 하나의 URL로 공유하세요.
      </p>

      <h2 className="mt-10 text-sm font-semibold text-muted">링크 페이지</h2>
      <ul {...editable("링크 페이지 목록", FILE)} className="mt-3 flex flex-col gap-3">
        {profiles.map((p) => (
          <li key={p.username}>
            <Link
              href={`/${p.username}`}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-accent"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-sm text-muted">/{p.username}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
