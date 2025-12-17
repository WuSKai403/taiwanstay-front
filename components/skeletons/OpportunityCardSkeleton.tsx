import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OpportunityCardSkeleton() {
    return (
        <Card className="h-full flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <Skeleton className="h-full w-full" />
            </div>
            <CardHeader className="space-y-1">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-12 rounded-md" />
                    <Skeleton className="h-5 w-12 rounded-md" />
                </div>
            </CardContent>
            <CardFooter className="pt-4 border-t">
                <div className="flex justify-between w-full items-center">
                    <div className="flex gap-2">
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
            </CardFooter>
        </Card>
    );
}
