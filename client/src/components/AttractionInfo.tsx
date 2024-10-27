interface AttractionInfoProps {
    type?: string;
    waitTime?: string;
    rating?: string;
    cityName: string;
}

export function AttractionInfo({ type, waitTime = "1h", rating = "Great", cityName }: AttractionInfoProps) {
    return (
        <div className="font-mono text-xs">
            <table>
                <tbody>
                    <tr>
                        <td className="pr-4 min-w-[100px]">type</td>
                        <td>{type}</td>
                    </tr>
                    <tr>
                        <td className="pr-4 min-w-[100px]">wait-time</td>
                        <td>{waitTime}</td>
                    </tr>
                    <tr>
                        <td className="pr-4 min-w-[100px]">rating</td>
                        <td>{rating}</td>
                    </tr>
                    <tr>
                        <td className="pr-4 min-w-[100px]">city</td>
                        <td>{cityName}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
