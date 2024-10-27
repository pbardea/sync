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
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { ScrollBar } from "./components/ui/scroll-area"
import { AttractionFilterComponent, RatingFilter } from "./components/attraction-filter"
import { AttractionCard } from "./components/AttractionCard"
import { AttractionMarker } from './components/AttractionMarker'
import { AttractionInfo } from "./components/AttractionInfo"
import { PhotoGallery } from "./components/PhotoGallery"
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import { GestureHandling } from 'leaflet-gesture-handling';
import L from 'leaflet';
import MarkerClusterGroup from "react-leaflet-cluster"

L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

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

  return (
    <div className="h-screen flex flex-col mx-auto container">
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-4xl font-bold mb-2">{attraction?.name}</h1>
        <nav aria-label="Breadcrumb" className="max-w-lg">
          <ol className="flex items-center text-gray-500 text-sm">
            <li className="flex items-center">
              <Link
                to={`/trips/${trip?.id}`}
                className="hover:text-gray-700 border-b border-gray-300 pb-1"
              >
                {trip?.name}
              </Link>
            </li>
            {attraction?.city && <>
              <li className="mx-2 text-gray-400">/</li>
              <li className="flex items-center">
                <Link to={`/trips/${tripId}/cities/${attraction?.city.id}`} className="hover:text-gray-700 border-b border-gray-300 pb-1" >
                  {attraction?.city?.name}
                </Link>
              </li>
            </>
            }
            <li className="mx-2 text-gray-400">/</li>
            <li className="flex items-center">
              <Link to='#' className="hover:text-gray-700 border-b border-gray-300 pb-1" >
                {attraction?.name}
              </Link>
            </li>
          </ol>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden px-4">
        {/* Fixed Left Sidebar - 1/3 width */}
        <div className="w-1/3 pr-4 overflow-y-auto">
          {attraction?.factAttraction?.description && (
            <>
              <h1 className="text-2xl font-bold mb-2">About</h1>
              <p className="text-xs text-gray-600 leading-relaxed">
                {attraction.factAttraction.description}
              </p>
            </>
          )}
          <MapContainer
            className="full-width-map mt-4"
            center={[attraction?.factAttraction?.lat ?? 0, attraction?.factAttraction?.lon ?? 0]}
            zoom={16}
            minZoom={1}
            maxZoom={18}
            zoomControl={true}
            scrollWheelZoom={true}
            gestureHandling={true}
          >
            <TileLayer
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />
            <MarkerClusterGroup>
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
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        {/* Scrollable Right Content - 2/3 width */}
        <div className="w-2/3">
          <ScrollArea className="h-full pr-6 overflow-y-auto overscroll-contain">
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
              <AttractionInfo
                type={attraction?.factAttraction?.type}
                rating={attraction?.rating?.toString()}
                cityName={attraction?.city?.name ?? ""}
              />
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
          </ScrollArea>
        </div>
      </div>
    </div>
  )
});
