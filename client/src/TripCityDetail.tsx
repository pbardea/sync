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
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { AttractionFilterComponent, RatingFilter } from "./components/attraction-filter"

export const TripCityDetail = observer(() => {
    const { tripId, cityId } = useParams();
    const pool = useContext(PoolContext);
    const home = pool.getRoot as Home;
    const currentUser = home.members.find((x) => x.name === "Paul Bardea");
    const trip = currentUser?.trips.items.find((x: Trip) => x.id === tripId);
    const city = trip?.cities.find((x: TripCity) => x.id === cityId);

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
                <div className="col-span-2">
                    <ScrollArea>
                    <h2 className="text-2xl font-semibold mb-4">{currentUser?.name.split(" ")[0]}'s Thoughts</h2>
                    <span className="text-sm text-gray-600">
                        <b>Local Festivities:</b> Experience breathtaking foliage at Ohori Park and Maizuru Park for stunning fall colors.<br />
                        <b>Delicious Food:</b> Indulge in Hakata's famous ramen, street food in Yanagibashi Market, and fresh seafood at Nagahama Fish Market.<br />
                        <b>Immersive History:</b> Explore Dazaifu Tenmangu Shrine, Fukuoka Castle, and Hakata Machiya Folk Museum for a taste of history.<br />
                        <b>Shopping:</b> Discover trendy shops at Tenjin and Canal City Hakata for unique souvenirs.<br />
                        <b>Relax:</b> Unwind at hot springs in Beppu or Yufuin for a serene retreat from city buzz.<br />
                        <b>Festivals:</b> Check out local festivals like Hakata Dontaku during your visit for a vibrant cultural experience.<br />
                    </span>
                    <h2 className="text-2xl font-semibold mb-4 mt-4">Attractions</h2>
                    <div className="flex space-x-4 mb-4">
                        <AttractionFilterComponent />
                        <RatingFilter />
                    </div>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1 mr-4">
                                {[
                                    { name: "%ARABICA Arashiyama", desc: "A cafe with a view" },
                                    { name: "Coffee Glitch Ginza", desc: "Popular coffee spot with specialty beans" },
                                    { name: "Hakata Issou", desc: "美味しいラーメン" },
                                    { name: "%ARABICA Arashiyama", desc: "A cafe with a view" },
                                    { name: "Coffee Glitch Ginza", desc: "Popular coffee spot with specialty beans" },
                                    { name: "Hakata Issou", desc: "美味しいラーメン" },
                                    { name: "%ARABICA Arashiyama", desc: "A cafe with a view" },
                                    { name: "Coffee Glitch Ginza", desc: "Popular coffee spot with specialty beans" },
                                    { name: "Hakata Issou", desc: "美味しいラーメン" },
                                ].map((attraction, index) => (
                                    <Card key={index} className="mb-4">
                                        <CardHeader>
                                            <CardTitle className="text-sm">{attraction.name}</CardTitle>
                                            <p className="text-xs text-gray-500">{attraction.desc}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between text-xs">
                                                <span>Type: Cafe</span>
                                                <span>Wait time: 1h</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span>Rating: Great</span>
                                                <span>City: Tokyo</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </div>
                <div className="col-span-1 mx-auto">
                    <h1 className="text-2xl font-bold mb-2">About</h1>
                    <p className="text-xs text-gray-600 leading-relaxed">
                        Fukuoka is the largest city and metropolitan area west of Keihanshin in
                        Japan, designated a government ordinance on April 1, 1972. Known as
                        Kyushu's historic gateway to Asia, Fukuoka offers watersports along
                        its shoreline, mountain trails, and renowned seafood and ramen
                        cuisine.
                    </p>
                    <MapContainer
                        className="full-width-map mt-4"
                        center={[city?.lat, city?.lon]}
                        zoom={city?.zoomLevel}
                        minZoom={3}
                        maxZoom={19}
                        zoomControl={false}
                        scrollWheelZoom={true}>
                        <TileLayer
                            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                        />
                    </MapContainer>
                    <h1 className="text-2xl font-bold mt-2">Famous Attractions</h1>
                </div>
            </div>
        </div >
    )
});