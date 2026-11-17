// 개발 모드에서만 구성요소에 편집용 표시를 붙인다. 프로덕션 HTML에는 아무것도 남기지 않는다.
// 사용: <h1 {...editable("이름", "src/app/[username]/page.tsx")}>
export function editable(label: string, file: string) {
  if (process.env.NODE_ENV !== "development") return {};
  return { "data-edit": label, "data-edit-file": file };
}
