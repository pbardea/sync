import { observer } from "mobx-react"
import { Link, useParams } from "react-router-dom"

import 'leaflet/dist/leaflet.css'
import { useContext, useLayoutEffect } from "react"
import { Trip } from "./models/trip"
import { Home } from "./models/home"
import { PoolContext } from "./main"
import { TripCity } from "./models/trip_city"

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { ScrollArea } from "@radix-ui/react-scroll-area"
import { ScrollBar } from "./components/ui/scroll-area"
import { AttractionFilterComponent, RatingFilter } from "./components/attraction-filter"
import MarkerClusterGroup from "react-leaflet-cluster"
import { CreateAttractionButton } from "./components/CreateAttractionButton"
import { AttractionCard } from "./components/AttractionCard"
import { AttractionMarker } from './components/AttractionMarker'
import { PhotoGallery } from "./components/PhotoGallery"

export const TripCityDetail = observer(() => {
    const { tripId, cityId } = useParams();
    const pool = useContext(PoolContext);
    const home = pool.getRoot as Home;
    const currentUser = home.members.find((x) => x.name === "Paul Bardea");
    const trip = currentUser?.trips.items.find((x: Trip) => x.id === tripId);
    const city = trip?.cities.find((x: TripCity) => x.id === cityId);
    if (!city) {
        return <div>City not found</div>;
    }
    const attractions = city.attractions;

    useLayoutEffect(() => {
        window.scrollTo(0, 0)
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-4">
                <h1 className="text-4xl font-bold mb-2">{city?.name}</h1>
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
                        <li className="mx-2 text-gray-400">/</li>
                        <li className="flex items-center">
                            <Link to='#' className="hover:text-gray-700 border-b border-gray-300 pb-1" >
                                {city?.name}
                            </Link>
                        </li>
                    </ol>
                </nav>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-[calc(100vh-12rem)] overflow-y-auto">
                    <ScrollArea className="h-full pr-6">
                        <h2 className="text-2xl font-semibold mb-4">{currentUser?.name.split(" ")[0]}'s Thoughts</h2>
                        <span className="text-sm text-gray-600">
                            <b>Local Festivities:</b> Experience breathtaking foliage at Ohori Park and Maizuru Park for stunning fall colors.<br />
                            <b>Delicious Food:</b> Indulge in Hakata's famous ramen, street food in Yanagibashi Market, and fresh seafood at Nagahama Fish Market.<br />
                            <b>Immersive History:</b> Explore Dazaifu Tenmangu Shrine, Fukuoka Castle, and Hakata Machiya Folk Museum for a taste of history.<br />
                            <b>Shopping:</b> Discover trendy shops at Tenjin and Canal City Hakata for unique souvenirs.<br />
                            <b>Relax:</b> Unwind at hot springs in Beppu or Yufuin for a serene retreat from city buzz.<br />
                            <b>Festivals:</b> Check out local festivals like Hakata Dontaku during your visit for a vibrant cultural experience.<br />
                        </span>
                        <PhotoGallery photos_urls={city.attractions.flatMap((x) => x.pictures[0])} />
                        <h2 className="text-2xl font-semibold mb-4 mt-4">Attractions</h2>
                        <div className="flex space-x-4 mb-4 items-center justify-between">
                            <div className="flex space-x-4">
                                <AttractionFilterComponent />
                                <RatingFilter />
                            </div>
                            <CreateAttractionButton cityId={cityId} tripId={tripId} />
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                {attractions.map((attraction, index) => (
                                    <AttractionCard
                                        key={index}
                                        attraction={attraction}
                                        tripId={trip?.id ?? ""}
                                        cityName={city.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </div>
                <div className="col-span-1 mx-auto">
                    <h1 className="text-2xl font-bold mb-2">About</h1>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        {city?.userDescription}
                    </p>
                    <MapContainer
                        className="full-width-map mt-4"
                        center={[city?.lat, city?.lon]}
                        zoom={city?.zoomLevel}
                        minZoom={3}
                        maxZoom={19}
                        zoomControl={true}
                        scrollWheelZoom={true}>
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                        />
                        <MarkerClusterGroup>
                            {attractions.map((attraction) => (
                                <AttractionMarker
                                    key={attraction.id}
                                    attraction={attraction}
                                />
                            ))}
                        </MarkerClusterGroup>
                    </MapContainer>
                </div>
            </div>
        </div >
    )
});
