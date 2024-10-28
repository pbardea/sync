import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "../ui/scroll-area";

interface TwoColumnLayoutProps {
  header: React.ReactNode;
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

export const TwoColumnLayout = ({
  header,
  leftColumn,
  rightColumn,
}: TwoColumnLayoutProps) => {
  return (
    <div className="h-screen flex flex-col mx-auto container">
      <div className="px-4 pt-8 pb-4">
        {header}
      </div>

      <div className="flex-1 flex overflow-hidden px-4">
        <div className="w-2/5 pr-4 overflow-y-auto h-full mr-6">
          {leftColumn}
        </div>

        <div className="w-3/5">
          <ScrollArea className="h-full pr-6 overflow-y-auto overscroll-contain">
            {rightColumn}
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
