import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Attraction } from "../models/attraction";
import { AttractionInfo } from "./AttractionInfo";

interface AttractionCardProps {
    attraction: Attraction;
    tripId: string;
    cityName: string;
}

export function AttractionCard({ attraction, tripId, cityName }: AttractionCardProps) {
    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle className="text-sm">{attraction.name}</CardTitle>
                <p className="text-xs text-gray-500">{attraction.factAttraction?.subtitle}</p>
            </CardHeader>
            {attraction.factAttraction?.description && (
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            {attraction.factAttraction?.description}
                        </div>
                        {attraction.factAttraction?.pictures[0] && (
                            <img
                                src={attraction.factAttraction.pictures[0]}
                                alt={attraction.name}
                                className="w-[140px] h-[140px] object-cover rounded-md flex-shrink-0"
                            />
                        )}
                    </div>
                </CardContent>
            )}
            <CardFooter className="flex justify-between items-center">
                <div className="flex justify-between items-center w-full">
                    <AttractionInfo
                        type={attraction.factAttraction?.type}
                        cityName={attraction.city?.name ?? cityName}
                    />
                    <Link to={`/trips/${tripId}/attractions/${attraction.id}`} className="flex items-center">
                        <Button variant="outline" size="sm">
                            See More
                        </Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
