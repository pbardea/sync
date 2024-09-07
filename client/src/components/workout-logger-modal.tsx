"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Exercise } from "@/Fitness";

type WorkoutType =
  | "Running"
  | "Cycling"
  | "Swimming"
  | "Weightlifting"
  | "Yoga";

export interface Workout {
  type: string;
  duration: number;
  time: Date;
  comments?: string;
}

interface WorkoutLoggerProps {
  workoutTypes: Exercise[];
  onLogWorkout: (_workout: Workout) => void;
}

export function WorkoutLoggerModal({
  workoutTypes,
  onLogWorkout,
}: WorkoutLoggerProps) {
  const [workout, setWorkout] = useState<Workout>({
    type: workoutTypes[0].name,
    duration: 0,
    time: new Date(),
    comments: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setWorkout((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: WorkoutType) => {
    setWorkout((prev) => ({ ...prev, type: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adjustedTime = new Date(
      workout.time.getTime() - workout.duration * 60000,
    );
    onLogWorkout({ ...workout, time: adjustedTime });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Log Workout</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log a Workout</DialogTitle>
          <DialogDescription>
            Enter the details of your workout below. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                onValueChange={handleTypeChange}
                defaultValue={workout.type}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select workout type" />
                </SelectTrigger>
                <SelectContent>
                  {workoutTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (min)
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={workout.duration}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                name="time"
                type="datetime-local"
                value={workout.time.toISOString().slice(0, 16)}
                onChange={(e) =>
                  setWorkout((prev) => ({
                    ...prev,
                    time: new Date(e.target.value),
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comments" className="text-right">
                Comments
              </Label>
              <Textarea
                id="comments"
                name="comments"
                value={workout.comments}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save workout</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
