// components/MapView.tsx
import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface MapViewProps {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const MapView: React.FC<MapViewProps> = ({ lat, lng }) => {
  return (
    <LoadScript googleMapsApiKey="AIzaSyAqNIqNzNqhDTZPQxCfvpEc5QxW0CrxjqM">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat, lng }}
        zoom={15}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;









