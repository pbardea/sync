import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "../ui/scroll-area";

interface TwoColumnLayoutProps {
  header: React.ReactNode;
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  leftColumnWidth?: "1/3" | "1/4" | "1/2";
}

export const TwoColumnLayout = ({
  header,
  leftColumn,
  rightColumn,
  leftColumnWidth = "1/3",
}: TwoColumnLayoutProps) => {
  return (
    <div className="h-screen flex flex-col mx-auto container">
      <div className="px-4 pt-8 pb-4">
        {header}
      </div>

      <div className="flex-1 flex overflow-hidden px-4">
        <div className={`w-${leftColumnWidth} pr-4 overflow-y-auto h-full mr-6`}>
          {leftColumn}
        </div>

        <div className={`w-${leftColumnWidth === "1/3" ? "2/3" : "3/4"}`}>
          <ScrollArea className="h-full pr-6 overflow-y-auto overscroll-contain">
            {rightColumn}
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
