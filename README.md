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
- 클릭 수: `data/clicks.json` 에 저장된다 (git 제외). 서버리스 환경에서는 파일이 유지되지 않으므로 배포 시 DB로 교체해야 한다.
