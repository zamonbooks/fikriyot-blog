import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fikriyot - Blog",
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
        <header className="relative overflow-hidden">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-black/80 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
          
          <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="flex flex-col items-center text-center">
              {/* Logo with glassmorphism effect */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-110"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-6 shadow-2xl">
                  <img 
                    src="/logo.svg" 
                    alt="Fikriyot" 
                    className="w-24 h-24 md:w-32 md:h-32 filter drop-shadow-2xl" 
                  />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl">
                Fikriyot
              </h1>
              <p className="text-gray-300 text-lg md:text-xl mb-3 font-medium">
                Fikr qilmaysizlarmi?!
              </p>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl mb-8">
                Nodavlat fikrlog. HAQqa ishqsiz — ishqqa haqsiz!
              </p>
              
              {/* Glassmorphism button */}
              <div className="flex items-center space-x-4">
                <a 
                  href="https://t.me/fikriyot_uz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all duration-300"></div>
                  <div className="relative bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/30 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-2xl">
                    📱 Telegram kanalimiz
                  </div>
                </a>
              </div>
            </div>
          </div>
        </header>
        
        <main className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          {children}
        </main>
        
        <footer className="relative mt-20 overflow-hidden">
          {/* Glassmorphism footer background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.05),transparent_70%)]"></div>
          
          <div className="relative max-w-6xl mx-auto px-4 py-12 text-center">
            <div className="border-t border-white/10 pt-8">
              <p className="text-gray-400 text-sm mb-4">© 2024 Fikriyot. Barcha huquqlar himoyalangan.</p>
              <div className="flex justify-center items-center space-x-6">
                <a 
                  href="https://t.me/fikriyot_uz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-lg group-hover:bg-white/20 transition-all duration-300"></div>
                  <div className="relative bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2">
                    <span>📱</span>
                    <span>Telegram</span>
                  </div>
                </a>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 text-sm">Nodavlat fikrlog</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
