import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Last Light · 文明余晖",
  description:
    "人类文明的最后一百年。一部关于生存、记忆与重大抉择的单人互动叙事。",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
