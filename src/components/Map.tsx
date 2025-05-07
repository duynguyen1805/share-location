'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { UserLocation } from '@/services/location';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component để cập nhật view của map
const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);

  return null;
};

// Component để zoom về vị trí hiện tại
const ZoomToCurrentLocation = () => {
  const map = useMap();
  const { currentLocation, getCurrentLocation } = useLocation();

  const handleZoomToCurrentLocation = () => {
    if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 15, {
        animate: true
      });
    } else {
      getCurrentLocation();
    }
  };

  return (
    <button
      onClick={handleZoomToCurrentLocation}
      className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
      title="Zoom to current location"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-gray-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  );
};

// Component để hiển thị marker của user
const UserMarker = ({ location, isCurrentUser }: { location: UserLocation; isCurrentUser: boolean }) => {
  const { followUser, unfollowUser, followingUserId } = useLocation();
  const { user } = useAuth();

  return (
    <Marker
      position={[location.lat, location.lng]}
    >
      <Popup>
        <div className="p-2">
          <div className="flex items-center gap-2 mb-2">
            {location.photoURL && (
              <Image
                src={location.photoURL}
                alt={location.displayName}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <h3 className="font-medium">{location.displayName}</h3>
              <p className="text-sm text-gray-500">
                {new Date(location.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          {!isCurrentUser && user && (
            <button
              onClick={() => {
                if (followingUserId === location.userId) {
                  unfollowUser();
                } else {
                  followUser(location.userId);
                }
              }}
              className={`w-full py-1 px-3 rounded text-sm ${
                followingUserId === location.userId
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {followingUserId === location.userId ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export const Map = () => {
  const { currentLocation, userLocations, followingUserId, error, retryLocation } = useLocation();
  const { user } = useAuth();

  // Debug logs
  useEffect(() => {
    console.log('Current Location:', currentLocation);
    console.log('User Locations:', userLocations);
  }, [currentLocation, userLocations]);

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-500 mb-4 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button
            onClick={retryLocation}
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Xác định center và zoom của map
  let center: [number, number] = [currentLocation.lat, currentLocation.lng];
  let zoom = 13;

  // Nếu đang theo dõi một user khác, center map vào vị trí của họ
  if (followingUserId && userLocations[followingUserId]) {
    const followedLocation = userLocations[followingUserId];
    center = [followedLocation.lat, followedLocation.lng];
    zoom = 15;
  }

  // Tạo một object chứa cả vị trí hiện tại và vị trí của các user khác
  const allLocations = {
    ...userLocations,
    ...(user && currentLocation ? {
      [user.uid]: {
        ...currentLocation,
        userId: user.uid,
        displayName: user.displayName || 'You',
        photoURL: user.photoURL || undefined,
        timestamp: Date.now(),
        isFollowing: false
      }
    } : {})
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater center={center} zoom={zoom} />
        <ZoomToCurrentLocation />
        
        {/* Hiển thị marker cho tất cả user bao gồm cả vị trí hiện tại */}
        {Object.entries(allLocations).map(([userId, location]) => (
          <UserMarker
            key={userId}
            location={location}
            isCurrentUser={userId === user?.uid}
          />
        ))}
      </MapContainer>
    </div>
  );
};