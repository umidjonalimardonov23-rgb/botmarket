import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Rating({ value, onChange, readOnly = false, className, size = "md" }: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSize = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-8 h-8"
  }[size];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          className={cn(
            "transition-colors",
            readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"
          )}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHoverValue(star)}
          onMouseLeave={() => !readOnly && setHoverValue(null)}
        >
          <Star
            className={cn(
              starSize,
              (hoverValue !== null ? star <= hoverValue : star <= value)
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
