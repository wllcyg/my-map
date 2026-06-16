import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: "丝绸之路全景地图 | Silk Road Interactive Map",
  description: "沉浸式探索古代丝绸之路的历史节点与跨越亚欧大陆的贸易路线。基于 Web GIS 构建的数字人文可视化平台。",
  keywords: ["丝绸之路", "历史地图", "Web GIS", "长安", "敦煌", "数字人文", "Silk Road"],
  authors: [{ name: "Your Name/Team" }],
  openGraph: {
    title: "丝绸之路全景地图",
    description: "跨越千年的文化交融之路，沉浸式互动体验。",
    type: "website",
    locale: "zh_CN",
    siteName: "Silk Road Map",
  },
  twitter: {
    card: "summary_large_image",
    title: "丝绸之路全景地图",
    description: "重走连接东西方文明的伟大贸易通道。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
