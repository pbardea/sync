import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { injestObjects, ObjectPool } from "./models/pool.ts";
import { Team } from "./models/team.ts";
import { User } from "./models/user.ts";
import { mainApi } from "./api/index.ts";

User.init();
Team.init();

await mainApi.login("pbardea", "password");
ObjectPool.reset(mainApi);
mainApi.setupSync(ObjectPool.getInstance());
const bootstrapJson = await mainApi.bootstrap();

const pool = ObjectPool.getInstance(mainApi);
injestObjects(bootstrapJson.objects, pool);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App team={ObjectPool.getInstance().getRoot as Team} />
  </StrictMode>,
);
