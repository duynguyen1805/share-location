import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/UserAvatar';
import { AuthModal } from '@/components/AuthModal';
import Image from 'next/image';

export const Header = () => {
  const { user, signInWithGoogle, signOut, error } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Share Location</h1>
          <div className="flex items-center gap-4">
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{user.displayName}</span>
                <UserAvatar user={user} />
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={signInWithGoogle}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Image
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-4 h-4"
                    height={16}
                    width={16}
                  />
                  Sign in with Google
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}; 