import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ObjectPool } from "./models/pool.ts";
import { Team } from "./models/team.ts";
import { User } from "./models/user.ts";
import { mainApi } from "./api/index.ts";
import Simple from "./simple.tsx";
import { action, observable } from "mobx";
import { ClientModel, Property } from "./models/base.ts";
import { SideNavigation } from "./components/side-navigation.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

await ObjectPool.init(mainApi);

User.init();
Team.init();

try {
    await mainApi.login("pbardea", "password");
} catch (e) {
    console.error(e);
}

const team = ObjectPool.getInstance().getRoot as Team;

export class TimerCollection {
    @observable
    accessor timers: Timer[] = [];
}

@ClientModel("Timer")
export class Timer {
    @Property()
    @observable
    accessor seconds = 0;

    @action
    updateSeconds() {
        this.seconds += 1;
    }
}

const timer = new Timer();
const timerCol = new TimerCollection();
timerCol.timers = [timer];

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <>
                <Simple timerCol={timerCol} />
                <SideNavigation />
                <App team={team} />
            </>
        ),
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);
