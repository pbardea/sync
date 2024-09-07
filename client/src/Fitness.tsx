import { observer } from "mobx-react";
import { ColorfulWorkoutTags } from "./components/colorful-workout-tags";
import { Workout, WorkoutLoggerModal } from "./components/workout-logger-modal";

export interface Exercise {
  name: string;
  color: string;
}


const Fitness = observer(() => {
  const handleLogWorkout = (workout: Workout) => {
    console.log("Logged workout:", workout);
    // Here you would typically save the workout data to your backend or state management system
  };

  return (
    <>
      <ColorfulWorkoutTags />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Workout Logger</h1>
        <WorkoutLoggerModal
        workoutTypes={[{name: "test", color: "#000"}]}
          onLogWorkout={handleLogWorkout}
        />
      </div>
    </>
  );
});

export default Fitness;
