import { Marker, Popup } from 'react-leaflet'
import { UserAttraction } from '../models/user_attraction'
import L from 'leaflet'
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

interface AttractionMarkerProps {
  attraction: UserAttraction;
  isCurrentAttraction?: boolean;
}

export const AttractionMarker = ({ attraction, isCurrentAttraction }: AttractionMarkerProps) => {
  const icon = useMemo(() => new L.Icon({
    iconUrl: isCurrentAttraction 
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }), [isCurrentAttraction]);

  return (
    <Marker
      position={[
        attraction.factAttraction?.lat,
        attraction.factAttraction?.lon,
      ]}
      icon={icon}
    >
      <Popup>
        {isCurrentAttraction ? (
          <b>{attraction.name}</b>
        ) : (
          <Link to={`/trips/${attraction.trip?.id}/attractions/${attraction.id}`} className="hover:underline">
            <b>{attraction.name}</b>
          </Link>
        )}
        <br />
        <br />
        <div className={'line-clamp-3 overflow-hidden'}>
          {attraction.factAttraction?.description}
        </div>
      </Popup>
    </Marker>
  );
};
