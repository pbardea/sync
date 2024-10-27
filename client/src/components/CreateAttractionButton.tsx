import { Button } from "./ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"

interface CreateAttractionButtonProps {
    cityId?: string;
    tripId?: string;
}

export function CreateAttractionButton({ cityId, tripId }: CreateAttractionButtonProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Add Attraction</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Attraction</DialogTitle>
                </DialogHeader>
                {/* Add your form components here */}
            </DialogContent>
        </Dialog>
    )
}
