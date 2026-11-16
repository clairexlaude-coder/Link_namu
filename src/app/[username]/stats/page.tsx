import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getProfile, profiles } from "@/data/profiles";
import { getClickCounts } from "@/lib/clicks";

export function generateStaticParams() {
  return profiles.map((p) => ({ username: p.username }));
}

export async function generateMetadata({ params }: PageProps<"/[username]/stats">): Promise<Metadata> {
  const { username } = await params;
  const profile = getProfile(username);
  return profile ? { title: `${profile.name} 클릭 수 | 링크나무` } : {};
}

export default function StatsPage({ params }: PageProps<"/[username]/stats">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-14 pb-10">
      <h1 className="text-xl font-bold">링크별 클릭 수</h1>
      <Suspense fallback={<p className="mt-6 text-sm text-muted">불러오는 중…</p>}>
        <ClickTable params={params} />
      </Suspense>
    </main>
  );
}

async function ClickTable({ params }: { params: PageProps<"/[username]/stats">["params"] }) {
  const { username } = await params;
  const profile = getProfile(username);
  if (!profile) notFound();

  // 클릭 수는 요청마다 최신 값을 읽는다.
  await connection();
  const counts = await getClickCounts(
    profile.username,
    profile.links.map((l) => l.id),
  );
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <p className="mt-1 text-sm text-muted">
        {profile.name} · 전체{" "}
        <span className="font-semibold text-foreground tabular-nums">{total.toLocaleString()}</span>회
      </p>
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {profile.links.map((link) => (
          <li key={link.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="font-medium">{link.title}</p>
              <p className="truncate text-xs text-muted">{link.url}</p>
            </div>
            <span className="shrink-0 text-lg font-semibold tabular-nums">
              {counts[link.id].toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      <Link href={`/${profile.username}`} className="mt-6 text-sm text-muted hover:text-foreground">
        ← {profile.name} 페이지로
      </Link>
    </>
  );
}
