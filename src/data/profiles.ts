export type LinkItem = {
  /** 프로필 안에서 고유한 링크 ID. 클릭 집계 키와 공유 URL(/go/...)에 쓰인다. */
  id: string;
  title: string;
  url: string;
};

export type Profile = {
  /** 공유 URL의 경로가 된다: /{username} */
  username: string;
  name: string;
  bio: string;
  /** public/ 아래의 이미지 경로 (예: /avatars/a4.png). 없으면 이름 첫 글자로 표시한다. */
  avatarUrl?: string;
  links: LinkItem[];
};

export const profiles: Profile[] = [
  {
    username: "a4",
    name: "A4",
    bio: "오이쉬",
    avatarUrl: "/avatars/a4.jpg",
    links: [
      { id: "instagram", title: "Instagram", url: "https://www.instagram.com/" },
      { id: "youtube", title: "YouTube", url: "https://www.youtube.com/" },
      { id: "blog", title: "블로그", url: "https://blog.naver.com/" },
      { id: "github", title: "GitHub", url: "https://github.com/" },
    ],
  },
];

export function getProfile(username: string): Profile | undefined {
  return profiles.find((p) => p.username === username);
}
