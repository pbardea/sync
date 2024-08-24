import { useEffect, useState } from "react";
import "./App.css";
import { observer } from "mobx-react";
import { Team } from "./models/team";
import { mockApi } from "./api";

const App = observer((props: { team: Team }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        setTimeout(() => {
            const user = props.team?.members.find(
                (x) => x.id === "6f73afd5-b171-4ea5-80af-7e5040c178b2",
            );
            if (user === undefined) {
                return;
            }
            user.email = "hhahhaaha";
            user.save();
        }, 1000);
        setTimeout(() => {
            mockApi.runWorker();
        }, 5000);
    }, [props.team?.members]);

    return (
        <>
            <h1>{props.team?.name || "No team"}</h1>
            <div>{props.team?.members.map((x) => x.email).join(", ")}</div>

            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.tsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    );
});

export default App;
