import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fikriyot - Blog",
  description: "Fikriyot Telegram kanalining rasmiy blog sayti",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-white antialiased">
        <header className="bg-black border-b-2 border-black">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center">
              <img src="/logo.svg" alt="Fikriyot" className="h-32 w-32 mb-4" />
              <p className="text-gray-400 text-sm">Telegram kanalining rasmiy blog sayti</p>
            </div>
          </div>
        </header>
        
        <main className="max-w-5xl mx-auto px-4 py-12">
          {children}
        </main>
        
        <footer className="bg-black border-t-2 border-black mt-20">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">© 2024 Fikriyot. Barcha huquqlar himoyalangan.</p>
            <p className="mt-3">
              <a 
                href="https://t.me/fikriyot_uz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
              >
                Telegram kanalimiz →
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
