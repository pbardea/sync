import { useContext } from "react";
import { Home } from "@/models/home";
import { observer } from "mobx-react";
import { PoolContext } from "@/main";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "./components/ui/scroll-area";
import { Separator } from "@radix-ui/react-select";
import { cn } from "./lib/utils";
import { NewTripButton } from "./components/new-trip-button";

interface CustomImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
}

function Image({ src, alt, width, height, className }: CustomImageProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden transition-all hover:scale-105",
                "aspect-[3/4]",
                className,
            )}
            style={{ width, height }}
        >
            <img src={src} alt={alt} className="h-full w-full object-cover" />
        </div>
    );
}

export const Trips = observer(() => {
    const pool = useContext(PoolContext);
    const home = pool.getRoot as Home;
    const currentUser = home.members.find((x) => x.name === "Paul Bardea");
    const trips = currentUser?.trips.items ?? [];

    return (
        <div style={{ padding: 35 }}>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                Ahoy, {currentUser?.name.split(" ")[0]}
            </h1>
            <div
                className="flex items-center justify-between"
                style={{ paddingTop: 35 }}
            >
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">My Trips</h2>
                </div>
                <NewTripButton />
            </div>
            <Separator className="my-4" />
            <div className="relative">
                <ScrollArea>
                    <div className="flex space-x-4 pb-4">
                        {trips.map((trip) => (
                            <div key={trip.id}>
                                <div className="overflow-hidden rounded-md">
                                    <Image
                                        src={trip.headlinePicture ?? ""}
                                        alt={trip.name}
                                        width={250}
                                        height={330}
                                        className={cn(
                                            "h-auto w-auto object-cover transition-all hover:scale-105",
                                            "aspect-[3/4]",
                                        )}
                                    />
                                </div>
                                <div className="space-y-10 text-sm" style={{ paddingTop: 4 }}>
                                    <h3 className="font-medium leading-none">{trip.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {trip.subHeading}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
});
