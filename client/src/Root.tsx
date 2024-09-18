import { observer } from "mobx-react";
// import { SideNavigation } from "./components/side-navigation";
import React from "react";

const Root = observer((props: { children: React.ReactNode }) => {
    return (
        <div className="flex">
            {/* <SideNavigation /> */}
            <main className="flex-1">{props.children}</main>
        </div>
    );
});

export default Root;
