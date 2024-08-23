import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { injestObjects, ObjectPool } from "./models/pool.ts";
import { Team } from "./models/team.ts";
import { User } from "./models/user.ts";

new Team();
new User();

const pool = ObjectPool.getInstance();
const bootstrapJson = [
    {
        id: "6f73afd5-b171-4ea5-80af-7e5040c178b2",
        name: "Paul Bardea",
        teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
        lastModifiedDate: new Date().toISOString(),
        __class: "User",
    },
    {
        id: "e86cd579-c61c-4f7b-ad53-d1f8670968dc",
        name: "Paul",
        email: "paul@pbardea.com",
        teamId: "279592c1-2334-430b-b97f-a8f9265d4805",
        lastModifiedDate: new Date().toISOString(),
        __class: "User",
    },
    {
        id: "279592c1-2334-430b-b97f-a8f9265d4805",
        name: "Team A",
        lastModifiedDate: new Date().toISOString(),
        __class: "Team",
    },
    {
        id: "8949e0a4-357b-4a42-b6a3-ec90699197e7",
        name: "Orphan",
        email: "paul@pbardea.com",
        lastModifiedDate: new Date().toISOString(),
        __class: "User",
    },
];
injestObjects(bootstrapJson, pool);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App team={ObjectPool.getInstance().getRoot() as Team} />
  </StrictMode>,
);
