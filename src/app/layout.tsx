import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '简历工作台',
  description: 'AI JD 对齐简历工作台 — 沉淀经历资产，生成专业简历',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
