import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ApplicationCardSkeleton({ isHostView = false }: { isHostView?: boolean }) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-5 w-16 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-4">
                {isHostView && <Skeleton className="h-4 w-3/4 mb-2" />}
                {!isHostView && <Skeleton className="h-4 w-1/3 mb-2" />}

                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-md">
                    <div>
                        <Skeleton className="h-3 w-8 mb-1" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>

                <div className="space-y-2 mt-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-9 w-full" />
            </CardFooter>
        </Card>
    );
}
