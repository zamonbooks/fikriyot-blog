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
      <body className="min-h-screen bg-gray-50 antialiased">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Fikriyot</h1>
            <p className="text-gray-600 mt-1">Telegram kanalining rasmiy blog sayti</p>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
        
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-600">
            <p>© 2024 Fikriyot. Barcha huquqlar himoyalangan.</p>
            <p className="mt-2">
              <a 
                href="https://t.me/fikriyot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Telegram kanalimiz
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
