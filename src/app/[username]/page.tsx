import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { getProfile, profiles } from "@/data/profiles";
import { editable } from "@/lib/editable";

const FILE = "src/app/[username]/page.tsx";

export function generateStaticParams() {
  return profiles.map((p) => ({ username: p.username }));
}

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const profile = getProfile(username);
  if (!profile) return {};
  return { title: `${profile.name} | 링크나무`, description: profile.bio };
}

// params 접근은 <Suspense> 안에서 한다 (Cache Components 즉시 내비게이션 규칙).
export default function ProfilePage({ params }: PageProps<"/[username]">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-5 pt-14 pb-10">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent params={params} />
      </Suspense>
    </main>
  );
}

async function ProfileContent({ params }: { params: PageProps<"/[username]">["params"] }) {
  const { username } = await params;
  const profile = getProfile(username);
  if (!profile) notFound();

  return (
    <>
      <Avatar name={profile.name} src={profile.avatarUrl} />
      <h1 {...editable("이름", FILE)} className="mt-5 text-xl font-bold">{profile.name}</h1>
      <p {...editable("한 줄 소개", FILE)} className="mt-1 text-sm text-muted">{profile.bio}</p>

      <ul {...editable("링크 카드 목록", FILE)} className="mt-8 flex w-full flex-col gap-3">
        {profile.links.map((link) => (
          <li key={link.id}>
            {/* 일반 <a>: 클릭 집계 라우트를 거쳐 이동하므로 프리페치하지 않는다 */}
            <a
              {...editable(`링크 카드: ${link.title}`, FILE)}
              href={`/go/${profile.username}/${link.id}`}
              className="block w-full rounded-2xl border border-border bg-card px-5 py-4 text-center font-medium shadow-sm transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-0"
            >
              {link.title}
            </a>
          </li>
        ))}
      </ul>

      <footer {...editable("하단 메뉴", FILE)} className="mt-auto flex gap-4 pt-12 text-xs text-muted">
        <Link href={`/${profile.username}/stats`} className="hover:text-foreground">
          클릭 수 보기
        </Link>
        <Link href="/" className="hover:text-foreground">
          🌳 링크나무
        </Link>
      </footer>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-hidden className="flex w-full flex-col items-center">
      <div className="size-32 rounded-full bg-border" />
      <div className="mt-5 h-6 w-24 rounded bg-border" />
      <div className="mt-2 h-4 w-32 rounded bg-border" />
      <div className="mt-8 flex w-full flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-border" />
        ))}
      </div>
    </div>
  );
}
