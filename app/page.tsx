import PostList from '@/components/PostList';

export default function Home() {
  return (
    <div>
      <div className="mb-12 md:mb-16 text-center">
        <div className="relative group">
          {/* Glassmorphism background */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)] rounded-3xl"></div>
          
          <div className="relative p-8 md:p-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
              So'nggi Postlar
            </h2>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-6">
              Fikriyot kanalidagi eng so'nggi postlari
            </p>
            
            {/* Glassmorphism badge */}
            <div className="inline-block relative">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-lg"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full">
                <span className="text-gray-200 text-sm font-medium">📚 Fikr va mulohaza</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <PostList />
    </div>
  );
}
