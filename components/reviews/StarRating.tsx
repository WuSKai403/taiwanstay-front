"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number; // 0 to 5
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}

export function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    size = "md",
}: StarRatingProps) {
    const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    return (
        <div className="flex items-center gap-1">
            {stars.map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !readonly && onRatingChange?.(star)}
                    disabled={readonly}
                    className={cn(
                        "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary rounded-sm",
                        readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
                    )}
                >
                    <Star
                        className={cn(
                            sizeClasses[size],
                            star <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 fill-gray-100"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}
