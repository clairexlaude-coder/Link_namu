"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 개발 전용 "편집 모드": data-edit 가 붙은 구성요소에 마우스를 올리면 강조하고,
// 클릭하면 요청을 입력받아 /api/dev-edit 로 보낸다. 수정된 파일은 HMR로 바로 반영된다.

type Target = { label: string; file: string; html: string; rect: DOMRect };
type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "done"; ok: boolean; message: string };

function findEditable(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  if (node.closest("[data-edit-ui]")) return null;
  return node.closest<HTMLElement>("[data-edit]");
}

function toTarget(el: HTMLElement): Target {
  return {
    label: el.dataset.edit ?? "",
    file: el.dataset.editFile ?? "",
    html: el.outerHTML.slice(0, 1500),
    rect: el.getBoundingClientRect(),
  };
}

export function EditOverlay() {
  const [on, setOn] = useState(false);
  const [hover, setHover] = useState<Target | null>(null);
  const [selected, setSelected] = useState<Target | null>(null);
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const close = useCallback(() => {
    setSelected(null);
    setPrompt("");
    setStatus({ kind: "idle" });
  }, []);

  // 편집 모드일 때: 마우스 위치의 구성요소 강조 + 클릭 가로채기
  useEffect(() => {
    if (!on) return;

    const onMove = (e: MouseEvent) => {
      const el = findEditable(e.target);
      setHover(el ? toTarget(el) : null);
    };
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("[data-edit-ui]")) return;
      const el = findEditable(e.target);
      // 편집 모드에서는 링크 이동 등 원래 동작을 막는다
      e.preventDefault();
      e.stopPropagation();
      if (!el) return;
      setSelected(toTarget(el));
      setStatus({ kind: "idle" });
      setTimeout(() => inputRef.current?.focus(), 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selected) close();
        else setOn(false);
      }
    };
    const onScroll = () => setHover(null);

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      setHover(null);
    };
  }, [on, selected, close]);

  async function submit() {
    if (!selected || !prompt.trim() || status.kind === "running") return;
    setStatus({ kind: "running" });
    try {
      const res = await fetch("/api/dev-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: selected.label, file: selected.file, html: selected.html, prompt }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setStatus({ kind: "done", ok: data.ok, message: data.message });
      if (data.ok) setPrompt("");
    } catch (err) {
      setStatus({ kind: "done", ok: false, message: `요청 실패: ${(err as Error).message}` });
    }
  }

  const box = selected ?? hover;

  return (
    <div data-edit-ui className="font-sans">
      {/* 강조 테두리 */}
      {on && box && (
        <div
          className="pointer-events-none fixed z-[9998] rounded-md border-2 border-sky-500 bg-sky-500/10"
          style={{ top: box.rect.top - 4, left: box.rect.left - 4, width: box.rect.width + 8, height: box.rect.height + 8 }}
        >
          <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-sky-500 px-1.5 py-0.5 text-xs font-medium text-white">
            {box.label}
          </span>
        </div>
      )}

      {/* 요청 입력 패널 */}
      {on && selected && (
        <div className="fixed inset-x-3 bottom-20 z-[9999] mx-auto max-w-md rounded-2xl border border-border bg-card p-4 text-foreground shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{selected.label}</p>
              <p className="truncate text-xs text-muted">{selected.file}</p>
            </div>
            <button type="button" onClick={close} className="text-muted hover:text-foreground" aria-label="닫기">
              ✕
            </button>
          </div>
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            disabled={status.kind === "running"}
            rows={3}
            placeholder="어떻게 바꿀까요? 예: 글자를 더 크게, 배경을 연두색으로"
            className="mt-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-sky-500 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="min-w-0 text-xs text-muted">
              {status.kind === "running" && "Claude가 수정하는 중… (수십 초 걸릴 수 있어요)"}
              {status.kind === "done" && (
                <span className={status.ok ? "text-accent" : "text-red-500"}>{status.message}</span>
              )}
              {status.kind === "idle" && "Enter로 보내기 · Shift+Enter 줄바꿈 · Esc 닫기"}
            </p>
            <button
              type="button"
              onClick={submit}
              disabled={status.kind === "running" || !prompt.trim()}
              className="shrink-0 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {status.kind === "running" ? "수정 중…" : "보내기"}
            </button>
          </div>
        </div>
      )}

      {/* 편집 모드 토글 */}
      <button
        type="button"
        onClick={() => {
          if (on) close();
          setOn(!on);
        }}
        className={`fixed right-4 bottom-4 z-[9999] rounded-full px-4 py-2 text-sm font-medium shadow-lg transition ${
          on ? "bg-sky-500 text-white" : "border border-border bg-card text-foreground hover:border-sky-500"
        }`}
      >
        {on ? "편집 모드 끄기" : "✏️ 편집 모드"}
      </button>
    </div>
  );
}
