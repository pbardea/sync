import { useMemo, useState } from "react";

type Photo = {
    url: string;
    width: number;
    height: number;
}

export const PhotoGallery = ({ photos_urls }: { photos_urls: string[] }) => {
    if (photos_urls.length === 0) return null;

    const [photoDims, setPhotoDims] = useState<Record<string, { width: number; height: number }>>({});

    const photos: Photo[] = useMemo(() => {
        if (photos_urls.length === 0) return [];
        return photos_urls.map((url) => ({ url, width: photoDims[url]?.width ?? 0, height: photoDims[url]?.height ?? 0 }));
    }, [photos_urls, photoDims]);

    // Sort photos by aspect ratio (width/height)
    const sortedPhotos = [...photos].sort((a, b) =>
        (a.width && b.width && a.height && b.height) ? (b.width / b.height) - (a.width / a.height) : 0
    );

    const onImgLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
        const target = event.currentTarget;
        setPhotoDims({
            ...photoDims,
            [target.src]: {
                width: target.width,
                height: target.height,
            },
        });
    }

    return (
        <div className="w-[800px] h-[340px] mb-4 grid gap-2">
            {photos.length === 1 && (
                <div className="w-full h-full">
                    <img
                        src={sortedPhotos[0].url}
                        alt="Gallery photo"
                        className="w-full h-full object-cover rounded-lg"
                        onLoad={onImgLoad}
                    />
                </div>
            )}

            {photos.length === 2 && (
                <>
                    <div className="grid grid-cols-2 gap-2 h-full">
                        <img
                            src={sortedPhotos[0].url}
                            alt="Gallery photo"
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={onImgLoad}
                        />
                        <img
                            src={sortedPhotos[1].url}
                            alt="Gallery photo"
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={onImgLoad}
                        />
                    </div>
                </>
            )}

            {photos.length >= 3 && (
                <div className="grid grid-cols-2 gap-2 h-full">
                    <img
                        src={sortedPhotos[0].url}
                        alt="Gallery photo"
                        className="w-full h-full object-cover rounded-lg"
                        onLoad={onImgLoad}
                    />
                    <div className="grid grid-rows-2 gap-2">
                        <img
                            src={sortedPhotos[1].url}
                            alt="Gallery photo"
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={onImgLoad}
                        />
                        <img
                            src={sortedPhotos[2].url}
                            alt="Gallery photo"
                            className="w-full h-full object-cover rounded-lg"
                            onLoad={onImgLoad}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
