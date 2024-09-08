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

// Startup
await ObjectPool.init(mainApi);
User.init();
Home.init();
Trip.init();
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
                <App />
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
