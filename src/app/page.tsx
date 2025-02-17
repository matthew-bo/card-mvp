import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to Card Picker</h1>
        <p className="text-xl text-gray-600 mb-8">
          Get personalized credit card recommendations based on your spending habits.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 text-lg bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}