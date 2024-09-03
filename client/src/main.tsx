import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ObjectPool } from "./models/pool.ts";
import { Team } from "./models/team.ts";
import { User } from "./models/user.ts";
import { mainApi } from "./api/index.ts";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Root from "./Root.tsx";

await ObjectPool.init(mainApi);

User.init();
Team.init();

try {
    await mainApi.login("pbardea", "password");
} catch (e) {
    console.error(e);
}

const team = ObjectPool.getInstance().getRoot as Team;

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <Root>
                <App team={team} />
            </Root>
        ),
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
