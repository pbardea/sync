import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image } from "./Trips";
import { observer } from "mobx-react";
import { cn } from "./lib/utils";
import { Link, useParams } from "react-router-dom";
import { ScrollArea, ScrollBar } from "./components/ui/scroll-area";
import {
  AttractionFilterComponent,
  CityFilter,
  RatingFilter,
} from "./components/attraction-filter";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useContext, useMemo, useState } from "react";
import { Trip } from "./models/trip";
import { Home } from "./models/home";
import { PoolContext } from "./main";
import TripBlog from "./TripBlog";
import { AttractionMarker } from "./components/AttractionMarker";

// Add these imports at the top
import 'leaflet-gesture-handling/dist/leaflet-gesture-handling.css';
import { GestureHandling } from 'leaflet-gesture-handling';
import L from 'leaflet';
import { AttractionCard } from "./components/AttractionCard";
import { UserAttraction } from "./models/user_attraction";

// Add this line before your component
L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

function ChangeView({ attractions, selectedAttraction }: any) {
  const map = useMap();
  
  if (selectedAttraction) {
    map.setView([selectedAttraction.factAttraction?.lat, selectedAttraction.factAttraction?.lon], 16);
    return null;
  }
  
  let markerBounds = L.latLngBounds([]);
  attractions.forEach((attraction: any) => {
      markerBounds.extend([attraction.factAttraction?.lat, attraction.factAttraction?.lon])
  })
  map.fitBounds(markerBounds)   // <===== Error: Bounds are not valid.
  return null;
}

export const TripDetail = observer(() => {
  const { tripId } = useParams();
  const pool = useContext(PoolContext);
  const home = pool.getRoot as Home;
  const currentUser = home.members.find((x) => x.name === "Paul Bardea");
  const trip = currentUser?.trips.items.find((x: Trip) => x.id === tripId);

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const [selectedAttraction, setSelectedAttraction] = useState<UserAttraction | null>(null);

  const attractions = useMemo(() => trip?.attractions.slice().sort((a, b) => (a.city?.name ?? '').localeCompare(b.city?.name ?? '')), [trip?.attractions]);

  const selectAttraction = (attractionId: string) => {
    if (selectedAttraction && selectedAttraction.id === attractionId) {
      setSelectedAttraction(null);
    } else {
      setSelectedAttraction(attractions.find(a => a.id === attractionId) ?? null);
    }
  }

  const [hoveredAttraction, setHoveredAttraction] = useState<UserAttraction | null>(null);
  const hoverAttraction = (attractionId: string | null) => {
    setHoveredAttraction(attractions.find(a => a.id === attractionId) ?? null);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-4xl font-bold">{trip?.name}</h1>
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>U1</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="User" />
            <AvatarFallback>U2</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <p className="text-gray-600">Oct 17 - Oct 31 2023</p>
      <Tabs defaultValue="browse" className="mt-4">
        <TabsList>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
        </TabsList>
        <TabsContent value="guide">
          <TripBlog />
        </TabsContent>
        <TabsContent value="browse">
          <section className="mb-12">
            <div
              className="flex items-left justify-between"
              style={{ paddingTop: 35 }}
            >
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Highlights
                </h2>
              </div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex flex-row gap-4 mb-4">
                {(trip?.attractions ?? []).map((attraction) => ({
                  id: attraction.id,
                  title: attraction.name,
                  desc: attraction.factAttraction?.subtitle ?? "",
                  photo: attraction.pictures[0] ?? "",
                })).map((attraction, index) => (
                  <Link key={index} to={`/trips/${tripId}/attractions/${attraction.id}`}>
                    <div className="overflow-hidden rounded-md">
                      <Image
                        src={attraction.photo ?? ""}
                        alt={attraction.title}
                        width={250}
                        height={330}
                        className={cn(
                          "h-auto w-auto object-cover transition-all hover:scale-105",
                          "aspect-[3/4]",
                        )}
                      />
                    </div>
                    <div
                      className="space-y-1 text-sm"
                      style={{ paddingTop: 4 }}
                    >
                      <h3 className="font-medium leading-none">{attraction.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {attraction.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          <section className="mb-12">
            <div className="flex items-left justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Cities
                </h2>
              </div>
            </div>
            <ScrollArea className="w-full">
              <div className="flex flex-row gap-4 mb-4">
                {trip?.cities.map((city, index) => (
                  <Link key={index} to={`/trips/${tripId}/cities/${city.id}`}>
                    <div className="overflow-hidden rounded-md">
                      <Image
                        src={city.headlinePicture ?? ""}
                        alt={city.name}
                        width={250}
                        height={200}
                        className={cn(
                          "h-auto w-auto object-cover transition-all hover:scale-105",
                          "aspect-[3/4]",
                        )}
                      />
                    </div>
                    <div
                      className="space-y-1 text-sm"
                      style={{ paddingTop: 4 }}
                    >
                      <h3 className="font-medium leading-none">{city.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {city.subHeading}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Attractions</h2>
            <div className="flex space-x-4 mb-4">
              <AttractionFilterComponent />
              <CityFilter />
              <RatingFilter />
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-4 h-[80vh]">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-1 mr-4">
                    {attractions?.map((attraction, index) => (
                      <AttractionCard key={index} attraction={attraction} tripId={trip.id} compact={true} onClick={selectAttraction} onHover={hoverAttraction} isSelected={selectedAttraction?.id === attraction.id} />
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
              <div className="lg:col-span-2">
                <MapContainer
                  className="full-height-map"
                  gestureHandling={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                  />
                  <ChangeView attractions={attractions} selectedAttraction={selectedAttraction} />
                  <MarkerClusterGroup maxClusterRadius={!!hoveredAttraction ? 0 : 0}>
                    {attractions?.map((attraction) => (
                      <AttractionMarker
                        key={attraction.id}
                        attraction={attraction}
                        isCurrentAttraction={!!((selectedAttraction && selectedAttraction.id === attraction.id) || (hoveredAttraction && hoveredAttraction.id === attraction.id))}
                      />
                    ))}
                  </MarkerClusterGroup>
                </MapContainer>
              </div>
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
});

