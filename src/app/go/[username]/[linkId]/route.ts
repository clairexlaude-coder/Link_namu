import { getProfile } from "@/data/profiles";
import { recordClick } from "@/lib/clicks";

// 링크 카드 클릭: 클릭 수를 기록한 뒤 실제 링크로 이동시킨다.
// 이동할 URL은 프로필 데이터에 등록된 것만 허용한다(오픈 리다이렉트 방지).
export async function GET(_request: Request, ctx: RouteContext<"/go/[username]/[linkId]">) {
  const { username, linkId } = await ctx.params;
  const link = getProfile(username)?.links.find((l) => l.id === linkId);

  if (!link) {
    return new Response("링크를 찾을 수 없어요.", { status: 404 });
  }

  try {
    await recordClick(username, linkId);
  } catch (err) {
    // 집계에 실패해도 방문자는 목적지로 보낸다.
    console.error("클릭 기록 실패", err);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: link.url, "Cache-Control": "no-store" },
  });
}
