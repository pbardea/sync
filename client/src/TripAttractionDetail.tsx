import { observer } from "mobx-react"
import { Link, useParams } from "react-router-dom"

import 'leaflet/dist/leaflet.css'
import { useContext, useLayoutEffect } from "react"
import { Trip } from "./models/trip"
import { Home } from "./models/home"
import { PoolContext } from "./main"
import { UserAttraction } from "./models/user_attraction"

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { ScrollBar } from "./components/ui/scroll-area"
import { AttractionFilterComponent, RatingFilter } from "./components/attraction-filter"
import { AttractionCard } from "./components/AttractionCard"
import { AttractionMarker } from './components/AttractionMarker'
import { AttractionUserInfo } from "./components/AttractionUserInfo"
import { PhotoGallery } from "./components/PhotoGallery"
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import { GestureHandling } from 'leaflet-gesture-handling';
import L from 'leaflet';

L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

import { PageHeader } from "./components/layouts/PageHeader";
import { TwoColumnLayout } from "./components/layouts/TwoColumnLayout"
import { Clock, Globe, Instagram, MapPin } from "lucide-react"

export const TripAttractionDetail = observer(() => {
  const { tripId, attractionId } = useParams();
  const pool = useContext(PoolContext);
  const home = pool.getRoot as Home;
  const currentUser = home.members.find((x) => x.name === "Paul Bardea");
  const trip = currentUser?.trips.items.find((x: Trip) => x.id === tripId);
  const attraction = trip?.attractions.find((x: UserAttraction) => x.id === attractionId);

  const attractionsInCity = trip?.attractions.filter((x: UserAttraction) => x.city?.id === attraction?.city?.id && x.id !== attraction?.id) ?? [];

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  });

  const header = (
    <PageHeader
      title={attraction?.name ?? ""}
      breadcrumbs={[
        { label: trip?.name ?? "", to: `/trips/${trip?.id}` },
        ...(attraction?.city ? [{
          label: attraction.city.name,
          to: `/trips/${tripId}/cities/${attraction.city.id}`
        }] : []),
        { label: attraction?.name ?? "", to: "#" }
      ]}
    />
  );

  const leftColumn = (
    <>
      {attraction?.factAttraction?.description && (
        <>
          <h1 className="text-2xl font-bold mb-2">About</h1>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            {attraction.factAttraction.description}
          </p>
        </>
      )}
      <AttractionUserInfo
        type={attraction?.factAttraction?.type}
        rating={attraction?.rating?.toString()}
        cityName={attraction?.city?.name ?? ""}
      />
      <MapContainer
        className="full-width-map mt-4"
        center={[attraction?.factAttraction?.lat ?? 0, attraction?.factAttraction?.lon ?? 0]}
        zoom={14}
        minZoom={1}
        maxZoom={18}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        {attraction && (
          <AttractionMarker
            attraction={attraction}
            isCurrentAttraction={true}
          />
        )}
        {attractionsInCity.map((cityAttraction) => (
          <AttractionMarker
            key={cityAttraction.id}
            attraction={cityAttraction}
          />
        ))}
      </MapContainer>
      <div className="mt-8 mb-8 font-mono text-sm">
        {attraction?.factAttraction?.website && (
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4" />
            <a href={attraction.factAttraction.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {attraction.factAttraction.website}
            </a>
          </div>
        )}
        
        {attraction?.factAttraction?.instagram && (
          <div className="flex items-center gap-2 mb-2">
            <Instagram className="h-4 w-4" />
            <a href={`https://instagram.com/${attraction.factAttraction.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
              @{attraction.factAttraction.instagram}
            </a>
          </div>
        )}

        {attraction?.factAttraction?.address && (
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            <span>{attraction.factAttraction.address}</span>
          </div>
        )}

        {attraction?.factAttraction?.hours && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <div className="flex flex-col">
              {attraction.factAttraction.hours}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const rightColumn = (
    <>
      <h2 className="text-2xl font-semibold mb-4">{currentUser?.name.split(" ")[0]}'s Thoughts</h2>
      <div className="flex justify-between">
        <span className="text-sm text-gray-600 mr-4">
          <b>Local Festivities:</b> Experience breathtaking foliage at Ohori Park and Maizuru Park for stunning fall colors.<br />
          <b>Delicious Food:</b> Indulge in Hakata's famous ramen, street food in Yanagibashi Market, and fresh seafood at Nagahama Fish Market.<br />
          <b>Immersive History:</b> Explore Dazaifu Tenmangu Shrine, Fukuoka Castle, and Hakata Machiya Folk Museum for a taste of history.<br />
          <b>Shopping:</b> Discover trendy shops at Tenjin and Canal City Hakata for unique souvenirs.<br />
          <b>Relax:</b> Unwind at hot springs in Beppu or Yufuin for a serene retreat from city buzz.<br />
          <b>Festivals:</b> Check out local festivals like Hakata Dontaku during your visit for a vibrant cultural experience.<br />
        </span>
      </div>
      <PhotoGallery photos_urls={attraction?.pictures ?? []} />
      {attractionsInCity.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mb-4 mt-4">In the Neighborhood</h2>
          <div className="flex space-x-4 mb-4">
            <AttractionFilterComponent />
            <RatingFilter />
          </div>
          <div className="space-y-4">
            <div className="flex flex-col gap-1 mr-4">
              {attractionsInCity.map((attraction) => (
                <AttractionCard
                  key={attraction.id}
                  attraction={attraction}
                  tripId={tripId ?? ""}
                  cityName={attraction.city?.name ?? ""}
                />
              ))}
            </div>
          </div>
        </>
      )}
      <ScrollBar orientation="vertical" />
    </>
  );

  return (
    <TwoColumnLayout
      header={header}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
});
