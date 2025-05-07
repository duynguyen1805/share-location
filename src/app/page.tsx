'use client';

import { Header } from '@/components/Header';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';

// Dynamic import Map component với SSR disabled
const Map = dynamic(() => import('@/components/Map').then(mod => mod.Map), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  ),
});

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Welcome to Share Location
            </h2>
            <p className="text-gray-600">
              Please sign in to start sharing your location with others.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="h-[calc(100vh-64px)]">
        <Map />
      </div>
    </div>
  );
}
