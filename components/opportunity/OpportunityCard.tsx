import Link from "next/link";
import { Opportunity } from "@/lib/schemas/opportunity";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface OpportunityCardProps {
    opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
    const { title, location, type, media, id } = opportunity;

    // Fallback image logic
    const coverImage = media?.coverImage?.secureUrl || media?.images?.[0]?.secureUrl || '/placeholder-opportunity.jpg';

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 flex flex-col h-full">
            <div className="relative h-48 w-full overflow-hidden bg-muted">
                <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                    {type && (
                        <Badge variant="secondary" className="backdrop-blur-md bg-white/90 text-black font-medium hover:bg-white/100">
                            {type.replace("_", " ")}
                        </Badge>
                    )}
                </div>
            </div>

            <CardContent className="p-5 flex-grow">
                <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        <Link href={`/opportunities/${id}`} className="hover:underline decoration-2 underline-offset-2">
                            {title}
                        </Link>
                    </h3>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{location?.city}, {location?.country}</span>
                </div>
            </CardContent>

            <CardFooter className="p-5 pt-0 mt-auto">
                <Button className="w-full font-semibold" asChild>
                    <Link href={`/opportunities/${id}`}>View Details</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
