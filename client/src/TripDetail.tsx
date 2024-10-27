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
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import arcades from "../arcades.json";
import { useContext } from "react";
import { Trip } from "./models/trip";
import { Home } from "./models/home";
import { PoolContext } from "./main";
import TripBlog from "./TripBlog";

export const TripDetail = observer(() => {
  const { tripId } = useParams();
  const pool = useContext(PoolContext);
  const home = pool.getRoot as Home;
  const currentUser = home.members.find((x) => x.name === "Paul Bardea");
  const trip = currentUser?.trips.items.find((x: Trip) => x.id === tripId);

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <div className="space-y-4 h-[50vh]">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-1 mr-4">
                    {[
                      {
                        name: "%ARABICA Arashiyama",
                        desc: "A cafe with a view",
                      },
                      {
                        name: "Coffee Glitch Ginza",
                        desc: "Popular coffee spot with specialty beans",
                      },
                      { name: "Hakata Issou", desc: "美味しいラーメン" },
                      {
                        name: "%ARABICA Arashiyama",
                        desc: "A cafe with a view",
                      },
                      {
                        name: "Coffee Glitch Ginza",
                        desc: "Popular coffee spot with specialty beans",
                      },
                      { name: "Hakata Issou", desc: "美味しいラーメン" },
                      {
                        name: "%ARABICA Arashiyama",
                        desc: "A cafe with a view",
                      },
                      {
                        name: "Coffee Glitch Ginza",
                        desc: "Popular coffee spot with specialty beans",
                      },
                      { name: "Hakata Issou", desc: "美味しいラーメン" },
                    ].map((attraction, index) => (
                      <Card key={index} className="mb-4">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            {attraction.name}
                          </CardTitle>
                          <p className="text-xs text-gray-500">
                            {attraction.desc}
                          </p>
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
                  <ScrollBar orientation="vertical" />
                </ScrollArea>
              </div>
              <div className="lg:col-span-2">
                <MapContainer
                  className="full-height-map"
                  center={[38, 139.69222]}
                  zoom={6}
                  zoomControl={false}
                  minZoom={3}
                  maxZoom={19}
                  maxBounds={[
                    [-85.06, -180],
                    [85.06, 180],
                  ]}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                  />
                  <MarkerClusterGroup>
                    {arcades.features.map((arcade) => (
                      <Marker
                        key={arcade.properties["@id"]}
                        position={[
                          arcade.geometry.coordinates[1],
                          arcade.geometry.coordinates[0],
                        ]}
                      >
                        <Popup>
                          {arcade.properties.name}
                          <br />
                          {arcade.properties["name:en"]}
                        </Popup>
                      </Marker>
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
