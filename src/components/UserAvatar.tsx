import { User } from '@/types';
import Image from 'next/image';

interface UserAvatarProps {
  user: User;
}

export const UserAvatar = ({ user }: UserAvatarProps) => {
  return (
    <div className="relative">
      {user.photoURL ? (
        <Image
          src={user.photoURL}
          alt={user.displayName || 'User'}
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-gray-600 text-sm">
            {user.displayName?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
      )}
    </div>
  );
}; 