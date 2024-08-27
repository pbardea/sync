import "./App.css";
import { observer } from "mobx-react";
import { TimerCollection } from "./main";

const Simple = observer((props: { timerCol: TimerCollection }) => {
  return (
    <div>
      {props.timerCol.timers.map((x) => x.seconds)}
      <button onClick={() => props.timerCol.timers[0].updateSeconds()}>
        Increment
      </button>
    </div>
  );
});

export default Simple;
