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
    const { title, location, categories, images, id } = opportunity;

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50 flex flex-col h-full">
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={images?.[0] || "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2670&auto=format&fit=crop"}
                    alt={title || "Opportunity"}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                    {categories?.[0] && (
                        <Badge variant="secondary" className="backdrop-blur-md bg-white/90 text-black font-medium hover:bg-white/100">
                            {categories[0].replace("_", " ")}
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
