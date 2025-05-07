export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  userId: string;
  displayName: string;
  photoURL?: string;
}

export interface UserLocation extends Location {
  isFollowing: boolean;
}

export interface LocationWithUser extends Location {
  user: User;
} 