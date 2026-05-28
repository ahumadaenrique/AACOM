import { cn } from "@/lib/utils";
import { TrainTrackIcon } from "lucide-react";

interface TrafficLightProps {
    points: number;
}

export function TrafficLight({ points }: TrafficLightProps) {
    // RED: 0-15
    // YELLOW: 16-24
    // GREEN: 25+

    const isRed = points <= 15;
    const isYellow = points > 15 && points <= 24;
    const isGreen = points >= 25;

    return (
        <div className="flex flex-col items-center gap-2 p-2 bg-zinc-800 rounded-xl border border-zinc-700 shadow-xl">
            <div
                className={cn(
                    "w-12 h-12 rounded-full transition-all duration-500 shadow-inner",
                    isRed ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse" : "bg-red-950/30 opacity-20"
                )}
            />
            <div
                className={cn(
                    "w-12 h-12 rounded-full transition-all duration-500 shadow-inner",
                    isYellow ? "bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-pulse" : "bg-yellow-950/30 opacity-20"
                )}
            />
            <div
                className={cn(
                    "w-12 h-12 rounded-full transition-all duration-500 shadow-inner",
                    isGreen ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-pulse" : "bg-green-950/30 opacity-20"
                )}
            />
        </div>
    );
}
