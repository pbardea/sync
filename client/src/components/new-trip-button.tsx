"use client";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, X } from "lucide-react";
import { Trip } from "@/models/trip";
import { Home } from "@/models/home";
import { PoolContext } from "@/main";
import { Collection } from "@/models/slib/collection";

export function NewTripButton() {
    const pool = useContext(PoolContext);
    const home = pool.getRoot as Home;
    const currentUser = home.members.find((x) => x.name === "Paul Bardea")!;

    const [open, setOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const tripData = Object.fromEntries(formData.entries());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalData: Record<string, any> = { ...tripData, startDate, endDate };
        console.log("New trip data:", finalData);
        const trip = new Trip();
        trip.name = finalData.tripName;
        trip.subHeading = finalData.subHeading;
        trip.status = finalData.status;
        trip.startDate = finalData.startDate;
        trip.endDate = finalData.endDate;
        trip.headlinePicture = finalData.headlinePicture;
        trip.members = new Collection();
        trip.members.push(currentUser);
        trip.save();
        // Here you would typically send this data to your backend
        setOpen(false);
    };

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Trip
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Trip</DialogTitle>
                        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tripName">Trip Name *</Label>
                            <Input id="tripName" name="tripName" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? (
                                            format(startDate, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? (
                                            format(endDate, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subHeading">Sub Heading</Label>
                            <Input id="subHeading" name="subHeading" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="headlinePicture">Headline Pictures</Label>
                            <Input id="headlinePicture" name="headlinePicture" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue="Planning">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Planning">Planning</SelectItem>
                                    <SelectItem value="In-Progress">In-Progress</SelectItem>
                                    <SelectItem value="Complete">Complete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full">
                            Create Trip
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
