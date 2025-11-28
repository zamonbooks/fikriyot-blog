import PostList from '@/components/PostList';

export default function Home() {
  return (
    <div>
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold text-black mb-3">
          So'nggi postlar
        </h2>
        <p className="text-gray-600 text-lg">
          Fikriyot kanalining barcha postlari
        </p>
      </div>
      
      <PostList />
    </div>
  );
}
