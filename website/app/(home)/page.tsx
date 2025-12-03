import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1 min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-6 text-blue-600">better-react</h1>
      <p className="text-lg mb-8 max-w-2xl mx-auto">
        一个增强React开发体验的工具库，提供了一系列实用的组件和工具函数。
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link 
          href="/docs" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          查看文档
        </Link>
        <Link 
          href="https://github.com" 
          className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          GitHub
        </Link>
      </div>
    </div>
  );
}
