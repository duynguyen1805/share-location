import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { locationService } from '@/services/location';
import { UserLocation } from '@/types';
import { ref, onValue } from 'firebase/database';
import { database } from '@/services/firebase';

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};

export const useLocation = () => {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocations, setUserLocations] = useState<{ [key: string]: UserLocation }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);

  // Kiểm tra quyền truy cập vị trí
  const checkLocationPermission = useCallback(async () => {
    if (!navigator.permissions || !navigator.permissions.query) {
      setIsLocationEnabled(true);
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setIsLocationEnabled(result.state === 'granted');
      
      result.addEventListener('change', () => {
        setIsLocationEnabled(result.state === 'granted');
      });
    } catch (error) {
      console.log('Error checking location permission:', error);
      setIsLocationEnabled(true);
    }
  }, []);

  // Lấy vị trí hiện tại
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setError(null);
        setIsLoading(false);

        // Cập nhật vị trí lên Firebase nếu đã đăng nhập
        if (user) {
          locationService.updateUserLocation(user, { lat: latitude, lng: longitude });
        }
      },
      (error) => {
        console.log('Geolocation error:', error);
        let errorMessage = 'Không thể xác định vị trí của bạn';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Vui lòng cho phép truy cập vị trí của bạn';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Thông tin vị trí không khả dụng';
            break;
          case error.TIMEOUT:
            errorMessage = 'Yêu cầu vị trí hết thời gian chờ';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      },
      GEOLOCATION_OPTIONS
    );
  }, [user]);

  // Theo dõi vị trí
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setError(null);

        // Cập nhật vị trí lên Firebase nếu đã đăng nhập
        if (user) {
          locationService.updateUserLocation(user, { lat: latitude, lng: longitude });
        }
      },
      (error) => {
        console.log('Geolocation error:', error);
        let errorMessage = 'Không thể xác định vị trí của bạn';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Vui lòng cho phép truy cập vị trí của bạn';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Thông tin vị trí không khả dụng';
            break;
          case error.TIMEOUT:
            errorMessage = 'Yêu cầu vị trí hết thời gian chờ';
            break;
        }
        
        setError(errorMessage);
      },
      GEOLOCATION_OPTIONS
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user]);

  // Lắng nghe vị trí của tất cả user
  useEffect(() => {
    if (!user) return;

    // Kiểm tra kết nối Firebase
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snap) => {
      console.log('Firebase connection state:', snap.val());
    });

    // Khởi tạo location service cho user
    locationService.initializeForUser(user);

    const unsubscribe = locationService.subscribeToAllLocations((locations) => {
      console.log('Raw locations from Firebase:', locations);
      
      const formattedLocations: { [key: string]: UserLocation } = {};
      
      Object.entries(locations).forEach(([userId, location]) => {
        console.log(`Processing location for user ${userId}:`, location);
        
        // Chỉ hiển thị user đang online
        if (location.isOnline) {
          formattedLocations[userId] = {
            ...location,
            isFollowing: false,
            lastActive: location.lastActive,
            isOnline: location.isOnline
          };
        }
      });
      
      console.log('Formatted locations:', formattedLocations);
      setUserLocations(formattedLocations);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Khởi tạo theo dõi vị trí
  useEffect(() => {
    checkLocationPermission();
    getCurrentLocation();
    const cleanup = watchPosition();

    return () => {
      if (cleanup) cleanup();
    };
  }, [checkLocationPermission, getCurrentLocation, watchPosition]);

  // Thử lại khi có lỗi
  const retryLocation = useCallback(() => {
    setError(null);
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    currentLocation,
    userLocations,
    error,
    isLoading,
    isLocationEnabled,
    retryLocation,
    getCurrentLocation,
    followUser: (userId: string) => setFollowingUserId(userId),
    unfollowUser: () => setFollowingUserId(null),
    followingUserId
  };
}; 