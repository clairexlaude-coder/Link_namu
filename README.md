# 링크나무

내 모든 링크를 한 페이지에 모아두고, 하나의 URL로 공유하는 서비스. 요구사항은 [PRD.md](PRD.md) 참고.

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인한다.

## 구조

| 경로 | 설명 |
|---|---|
| `/` | 서비스 소개와 링크 페이지 목록 |
| `/{username}` | 공유용 링크 페이지 (프로필 + 링크 카드) |
| `/{username}/stats` | 링크별 누적 클릭 수 |
| `/go/{username}/{linkId}` | 클릭을 기록한 뒤 실제 링크로 이동 (302) |

- 프로필·링크 데이터: `src/data/profiles.ts` 에서 수정한다.
## 편집 모드 (개발 중에만)

`npm run dev` 화면 오른쪽 아래 **✏️ 편집 모드**를 켜고 구성요소를 클릭한 뒤 요청을 입력하면, 이 PC의 Claude Code CLI(`claude`)가 해당 파일을 수정하고 화면이 자동으로 갱신된다.

- 클릭 가능한 구성요소는 `editable(이름, 파일)`로 표시한다 (`src/lib/editable.ts`).
- 요청은 `/api/dev-edit`가 처리한다. 개발 서버의 localhost 화면에서만 받고, CLI는 명령 실행 도구 없이 파일 읽기/수정만 한다. 프로덕션에서는 버튼과 라우트가 모두 꺼진다.
- `claude` 경로가 다르면 환경변수 `CLAUDE_BIN`으로 지정한다.

## 데이터

- 클릭 수: `data/clicks.json` 에 저장된다 (git 제외). 서버리스 환경에서는 파일이 유지되지 않으므로 배포 시 DB로 교체해야 한다.
