import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { AttractionUserInfo } from "./AttractionUserInfo";
import { UserAttraction } from "@/models/user_attraction";
import { useMemo, useState } from "react";

interface AttractionCardProps {
    attraction: UserAttraction;
    tripId: string;
    compact?: boolean;
    onClick?: (attractionId: string) => void;
    onHover?: (attractionId: string | null) => void;
    isSelected?: boolean;
}

export function AttractionCard({ attraction, tripId, compact = false, onClick, onHover, isSelected }: AttractionCardProps) {
    const imageSize = compact ? "w-[70px] h-[70px]" : "w-[140px] h-[140px]";
    const [isHovered, setIsHovered] = useState(false);

    const borderColor = useMemo(() => {
        if (isSelected) return "border-blue-500";
        if (isHovered) return "border-gray-500";
        return "";
    }, [isSelected, isHovered]);

    const onEnterHandler = () => {
        setIsHovered(true);
        onHover?.(attraction.id);
    }
    const onLeaveHandler = () => {
        setIsHovered(false);
        onHover?.(null);
    }

    return (
        <Card className={`mb-4 ${borderColor}`} onClick={() => onClick?.(attraction.id)} onMouseEnter={onEnterHandler} onMouseLeave={onLeaveHandler}>
            <CardHeader>
                <CardTitle className="text-sm">{attraction.name}</CardTitle>
                <p className="text-xs text-gray-500">{attraction.factAttraction?.subtitle}</p>
            </CardHeader>
            {attraction.factAttraction?.description && (
                <CardContent>
                    <div className="flex gap-4">
                        <div className={`flex-1`}>
                            <p className={`${compact ? "text-xs line-clamp-5" : ""}`}>
                                {attraction.factAttraction?.description}
                            </p>
                        </div>
                        {attraction.pictures[0] && (
                            <img
                                src={attraction.pictures[0]}
                                alt={attraction.name}
                                className={`${imageSize} object-cover rounded-md flex-shrink-0`}
                            />
                        )}
                    </div>
                </CardContent>
            )}
            <CardFooter className={`flex justify-between items-center`}>
                <div className="flex justify-between items-center w-full">
                    <AttractionUserInfo
                        type={attraction.factAttraction?.type}
                        cityName={attraction.city?.name ?? ""}
                        compact={true}
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
