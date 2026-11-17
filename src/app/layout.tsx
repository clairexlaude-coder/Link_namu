import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { EditOverlay } from "@/components/dev/EditOverlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "링크나무",
  description: "내 모든 링크를 한 페이지에 모아두고, 하나의 URL로 공유하는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        {/* 개발 중에만: 화면에서 구성요소를 클릭해 수정 요청 */}
        {process.env.NODE_ENV === "development" && <EditOverlay />}
      </body>
    </html>
  );
}
