import type { Metadata } from "next";
import "./globals.css";
import ChannelHeader from "@/components/ChannelHeader";
import ChannelFooter from "@/components/ChannelFooter";

export const metadata: Metadata = {
  title: "Fikriyot",
  description: "Fikriyot Telegram kanalining rasmiy blog sayti",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', type: 'image/svg+xml', sizes: '300x300' }
    ],
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black antialiased">
        <ChannelHeader />
        
        <main className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          {children}
        </main>
        
        <ChannelFooter />
      </body>
    </html>
  );
}
