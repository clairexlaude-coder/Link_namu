import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// 개발 전용: 실행 화면에서 클릭한 구성요소를 로컬 Claude Code CLI로 수정한다.
// - NODE_ENV=development 에서만 동작하고, 프로덕션에서는 404.
// - localhost에서 온 같은 출처 요청만 받는다 (다른 사이트가 이 주소로 요청을 보내는 것 차단).
// - CLI는 --restricted 로 실행해 명령 실행 도구 없이 Read/Edit/Glob/Grep 만 쓴다.

const PROJECT_ROOT = process.cwd();
const TIMEOUT_MS = 5 * 60 * 1000;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

let running = false;

type EditRequest = {
  label?: unknown;
  file?: unknown;
  prompt?: unknown;
  html?: unknown;
};

function claudeBinary(): string {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  const exe = path.join(os.homedir(), ".local", "bin", process.platform === "win32" ? "claude.exe" : "claude");
  return existsSync(exe) ? exe : "claude";
}

function isLocalSameOrigin(request: Request): boolean {
  const host = request.headers.get("host") ?? "";
  const hostname = host.replace(/:\d+$/, "");
  if (!LOCAL_HOSTS.has(hostname)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function safeProjectFile(file: string): string | null {
  if (!file.startsWith("src/") || file.includes("..")) return null;
  const abs = path.resolve(/*turbopackIgnore: true*/ PROJECT_ROOT, file);
  if (!abs.startsWith(path.join(PROJECT_ROOT, "src") + path.sep) || !existsSync(abs)) return null;
  return file;
}

function buildPrompt(label: string, file: string, request: string, html: string): string {
  return [
    "너는 '링크나무' Next.js 프로젝트의 UI 편집 도우미야.",
    `사용자가 실행 화면에서 '${label}' 구성요소를 클릭하고 수정을 요청했어. 이 구성요소의 코드는 ${file} 에 있어.`,
    "프로필 이름·소개·링크 같은 데이터는 src/data/profiles.ts, 색상 토큰은 src/app/globals.css 에 있어.",
    "요청을 이루는 데 필요한 최소한의 파일만, 최소한으로 수정해. 다른 구성요소의 동작이나 data-edit 속성은 건드리지 마.",
    "이 프로젝트의 Next.js 버전은 학습 데이터와 다를 수 있으니, Next.js API를 새로 쓸 때는 AGENTS.md 지침을 따라.",
    "다 끝나면 무엇을 바꿨는지 한국어로 한두 문장만 답해.",
    "",
    `클릭한 요소의 HTML(참고용, 일부): ${html}`,
    "",
    `사용자 요청: ${request}`,
  ].join("\n");
}

function runClaude(prompt: string): Promise<{ ok: boolean; message: string }> {
  return new Promise((resolve) => {
    const child = spawn(
      claudeBinary(),
      [
        "-p",
        "--output-format", "json",
        "--permission-mode", "acceptEdits",
        "--restricted",
        "--no-session-persistence",
        "--tools", "Read", "Edit", "Glob", "Grep",
      ],
      { cwd: PROJECT_ROOT, windowsHide: true },
    );

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, message: "시간이 너무 오래 걸려 중단했어요 (5분)." });
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, message: `Claude CLI를 실행하지 못했어요: ${err.message}` });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        const out = JSON.parse(stdout) as { result?: string; is_error?: boolean };
        resolve({ ok: code === 0 && !out.is_error, message: out.result?.trim() || "완료했어요." });
      } catch {
        resolve({ ok: false, message: (stderr || stdout || `종료 코드 ${code}`).slice(0, 500) });
      }
    });

    child.stdin.end(prompt);
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }
  if (!isLocalSameOrigin(request)) {
    return Response.json({ ok: false, message: "로컬 개발 화면에서만 쓸 수 있어요." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as EditRequest;
  const label = typeof body.label === "string" ? body.label.slice(0, 100) : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 2000) : "";
  const html = typeof body.html === "string" ? body.html.slice(0, 1500) : "";
  const file = typeof body.file === "string" ? safeProjectFile(body.file) : null;

  if (!label || !prompt || !file) {
    return Response.json({ ok: false, message: "구성요소 정보나 요청 내용이 비어 있어요." }, { status: 400 });
  }
  if (running) {
    return Response.json({ ok: false, message: "이전 수정이 아직 진행 중이에요. 끝난 뒤 다시 보내 주세요." }, { status: 409 });
  }

  running = true;
  try {
    const result = await runClaude(buildPrompt(label, file, prompt, html));
    return Response.json(result, { status: result.ok ? 200 : 500 });
  } finally {
    running = false;
  }
}
