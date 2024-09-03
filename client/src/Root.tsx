import "./App.css";
import { observer } from "mobx-react";
import { SideNavigation } from "./components/side-navigation";

const Root = observer(({children}) => {
    return (
        <div className="flex">
            <SideNavigation />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
});

export default Root;
