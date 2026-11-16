import { promises as fs } from "node:fs";
import path from "node:path";

// 클릭 수는 로컬 JSON 파일에 저장한다: { "username/linkId": count }
// 서버리스 배포 환경에서는 파일 시스템이 유지되지 않으므로, 배포 시 DB로 교체해야 한다.
const DATA_DIR = path.join(process.cwd(), "data");
const CLICKS_FILE = path.join(DATA_DIR, "clicks.json");

type ClickCounts = Record<string, number>;

const key = (username: string, linkId: string) => `${username}/${linkId}`;

async function readAll(): Promise<ClickCounts> {
  try {
    return JSON.parse(await fs.readFile(CLICKS_FILE, "utf8")) as ClickCounts;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw err;
  }
}

// 동시에 들어온 클릭이 서로의 쓰기를 덮어쓰지 않도록 쓰기를 한 줄로 세운다.
let writeQueue: Promise<unknown> = Promise.resolve();

export function recordClick(username: string, linkId: string): Promise<void> {
  const run = writeQueue.then(async () => {
    const counts = await readAll();
    const k = key(username, linkId);
    counts[k] = (counts[k] ?? 0) + 1;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(CLICKS_FILE, JSON.stringify(counts, null, 2));
  });
  writeQueue = run.catch(() => {});
  return run;
}

export async function getClickCounts(
  username: string,
  linkIds: string[],
): Promise<Record<string, number>> {
  const counts = await readAll();
  return Object.fromEntries(linkIds.map((id) => [id, counts[key(username, id)] ?? 0]));
}
