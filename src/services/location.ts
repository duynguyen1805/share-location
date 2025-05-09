import { ref, set, onValue, off, DatabaseReference, serverTimestamp, get } from 'firebase/database';
import { database } from './firebase';
import { User } from '@/types';

export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
  userId: string;
  displayName: string;
  photoURL: string | null | '';
  lastActive: number;
  isOnline: boolean;
}

export interface UserLocation extends Location {
  isFollowing: boolean;
}

class LocationService {
  private locationRefs: { [key: string]: DatabaseReference } = {};
  private presenceRef: DatabaseReference;

  constructor() {
    this.presenceRef = ref(database, '.info/connected');
    console.log('LocationService initialized with database:', database);
    
    // Kiểm tra kết nối database
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snap) => {
      console.log('Database connection state:', snap.val());
    });
  }

  // Cập nhật trạng thái online/offline của user
  private setupPresence(user: User) {
    console.log('Setting up presence for user:', user.uid);
    const userStatusRef = ref(database, `status/${user.uid}`);

    onValue(this.presenceRef, async (snapshot) => {
      console.log('Presence state changed:', snapshot.val());
      if (snapshot.val() === false) {
        return;
      }

      try {
        // Khi user online
        await set(userStatusRef, {
          isOnline: true,
          lastActive: serverTimestamp(),
          userId: user.uid
        });
        console.log('User status set to online');

        // Khi user offline
        const onDisconnectRef = ref(database, `status/${user.uid}`);
        await set(onDisconnectRef, {
          isOnline: false,
          lastActive: serverTimestamp(),
          userId: user.uid
        });
        console.log('User status set to offline on disconnect');
      } catch (error) {
        console.error('Error setting user status:', error);
      }
    });
  }

  // Cập nhật vị trí của user hiện tại
  async updateUserLocation(user: User, location: { lat: number; lng: number }) {
    console.log('Updating location for user:', user.uid, location);
    try {
      const locationData: Location = {
        ...location,
        timestamp: Date.now(),
        userId: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null || '',
        lastActive: Date.now(),
        isOnline: true
      };

      // Kiểm tra database trước khi set
      const userLocationRef = ref(database, `locations/${user.uid}`);
      const snapshot = await get(userLocationRef);
      console.log('Current location data:', snapshot.val());

      await set(userLocationRef, locationData);
      console.log('Location updated successfully');

      // Kiểm tra sau khi set
      const newSnapshot = await get(userLocationRef);
      console.log('New location data:', newSnapshot.val());
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  // Lắng nghe vị trí của một user cụ thể
  subscribeToUserLocation(userId: string, callback: (location: Location | null) => void) {
    console.log('Subscribing to location for user:', userId);
    const locationRef = ref(database, `locations/${userId}`);
    this.locationRefs[userId] = locationRef;

    onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Location data received for user:', userId, data);
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
    console.log('Subscribing to all locations');
    const locationsRef = ref(database, 'locations');
    
    // Kiểm tra dữ liệu hiện tại
    get(locationsRef).then((snapshot) => {
      console.log('Current locations in database:', snapshot.val());
    });

    onValue(locationsRef, (snapshot) => {
      const data = snapshot.val() || {};
      console.log('All locations data received:', data);
      callback(data);
    });

    return () => {
      off(locationsRef);
    };
  }

  // Khởi tạo service cho một user
  initializeForUser(user: User) {
    console.log('Initializing location service for user:', user.uid);
    this.setupPresence(user);
  }
}

export const locationService = new LocationService(); 