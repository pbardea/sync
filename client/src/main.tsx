import { createContext, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ObjectPool } from "./models/slib/pool.ts";
import { Home } from "./models/home.ts";
import { User } from "./models/user.ts";
import { mainApi } from "./models/slib/api";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./Root.tsx";
import Settings from "./Settings.tsx";
import { Trip } from "./models/trip.ts";
import { Trips } from "./Trips.tsx";
import { TripDetail } from "./TripDetail.tsx";
import { TripCity } from "./models/trip_city.ts";
import { UserAttraction } from "./models/user_attraction.ts";
import { FactAttraction } from "./models/fact_attraction.ts";
import { TripCityDetail } from "./TripCityDetail.tsx";
import { TripAttractionDetail } from "./TripAttractionDetail.tsx";

// Startup
await ObjectPool.init(mainApi);
User.init();
Home.init();
Trip.init();
TripCity.init();
UserAttraction.init();
FactAttraction.init();

try {
    await mainApi.login("pbardea", "password");
} catch (e) {
    console.error(e);
}

const pool = ObjectPool.getInstance();
export const PoolContext = createContext<ObjectPool>(pool);

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <Root>
                <App />
            </Root>
        ),
    },
    {
        path: "/trips",
        element: (
            <Root>
                <Trips />
            </Root>
        ),
    },
    {
        path: "/trips/:tripId",
        element: (
            <Root>
                <TripDetail />
            </Root>
        ),
    },
    {
        path: "/trips/:tripId/cities/:cityId",
        element: (
            <Root>
                <TripCityDetail />
            </Root>
        ),
    },
    {
        path: "/trips/:tripId/attractions/:attractionId",
        element: (
            <Root>
                <TripAttractionDetail />
            </Root>
        ),
    },
    {
        path: "/settings",
        element: (
            <Root>
                <Settings />
            </Root>
        ),
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <PoolContext.Provider value={pool}>
            <RouterProvider router={router} />
        </PoolContext.Provider>
    </StrictMode>,
);
