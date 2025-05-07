import { ref, set, onValue, off, DatabaseReference } from 'firebase/database';
import { database } from './firebase';
import { User } from '@/types';

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

class LocationService {
  private locationRefs: { [key: string]: DatabaseReference } = {};

  // Cập nhật vị trí của user hiện tại
  updateUserLocation(user: User, location: { lat: number; lng: number }) {
    const locationData: Location = {
      ...location,
      timestamp: Date.now(),
      userId: user.uid,
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || undefined,
    };

    const userLocationRef = ref(database, `locations/${user.uid}`);
    return set(userLocationRef, locationData);
  }

  // Lắng nghe vị trí của một user cụ thể
  subscribeToUserLocation(userId: string, callback: (location: Location | null) => void) {
    const locationRef = ref(database, `locations/${userId}`);
    this.locationRefs[userId] = locationRef;

    onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    return () => {
      if (this.locationRefs[userId]) {
        off(this.locationRefs[userId]);
        delete this.locationRefs[userId];
      }
    };
  }

  // Lắng nghe vị trí của tất cả user
  subscribeToAllLocations(callback: (locations: { [key: string]: Location }) => void) {
    const locationsRef = ref(database, 'locations');
    
    onValue(locationsRef, (snapshot) => {
      const data = snapshot.val() || {};
      callback(data);
    });

    return () => {
      off(locationsRef);
    };
  }
}

export const locationService = new LocationService(); 