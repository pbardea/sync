import { observer } from "mobx-react"
import { useParams } from "react-router-dom"

import 'leaflet/dist/leaflet.css'
import { useContext, useLayoutEffect } from "react"
import { Trip } from "./models/trip"
import { Home } from "./models/home"
import { PoolContext } from "./main"
import { TripCity } from "./models/trip_city"

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer } from 'react-leaflet'
import { ScrollBar } from "./components/ui/scroll-area"
import { AttractionFilterComponent, RatingFilter } from "./components/attraction-filter"
import { CreateAttractionButton } from "./components/CreateAttractionButton"
import { AttractionCard } from "./components/AttractionCard"
import { AttractionMarker } from './components/AttractionMarker'
import { PhotoGallery } from "./components/PhotoGallery"
import { PageHeader } from "./components/layouts/PageHeader"
import { TwoColumnLayout } from "./components/layouts/TwoColumnLayout"
import MarkerClusterGroup from "react-leaflet-cluster"

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

    const header = (
        <PageHeader
            title={city?.name ?? ""}
            breadcrumbs={[
                { label: trip?.name ?? "", to: `/trips/${trip?.id}` },
                { label: city?.name ?? "", to: "#" }
            ]}
        />
    );

    const leftColumn = (
        <>
            <h1 className="text-2xl font-bold mb-2">About</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
                {city?.userDescription}
            </p>
            <MapContainer
                className="full-width-map mt-4"
                center={[city?.lat, city?.lon]}
                zoom={city?.zoomLevel}
                minZoom={10}
                maxZoom={18}
                zoomControl={true}
                scrollWheelZoom={true}>
                <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                />
                <MarkerClusterGroup maxClusterRadius={25} showCoverageOnHover={false}>
                    {attractions.map((attraction) => (
                        <AttractionMarker
                        key={attraction.id}
                            attraction={attraction}
                        />
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </>
    );

    const rightColumn = (
        <>
            {city?.thoughts && <>
                <h2 className="text-2xl font-semibold mb-4">{currentUser?.name.split(" ")[0]}'s Thoughts</h2>
                <span className="text-sm text-gray-600">
                    <div
                        dangerouslySetInnerHTML={{ __html: city?.thoughts ?? "" }}
                    />
                </span>
            </>}
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
