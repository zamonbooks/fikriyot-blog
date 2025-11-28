import PostList from '@/components/PostList';

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          So'nggi postlar
        </h2>
        <p className="text-gray-600">
          Fikriyot kanalining barcha postlari
        </p>
      </div>
      
      <PostList />
    </div>
  );
}
