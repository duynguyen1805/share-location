import { UserLocation } from '@/services/location';

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
  photoURL?: string | null | '';
}

export interface LocationWithUser extends Location {
  user: User;
}

export type { UserLocation }; 