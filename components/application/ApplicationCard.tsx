import Link from "next/link";
import { Application } from "@/lib/schemas/application";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock } from "lucide-react";

interface ApplicationCardProps {
    application: Application;
}

export function ApplicationCard({ application }: ApplicationCardProps) {
    // Assuming backend populates opportunity details or we fetch them.
    // If Application type from schema doesn't have nested opportunity, we might need an extended type or separate fetch.
    // For this slice, let's assume the API returns enriched data or we display basic info.
    // Actually, domain.Application usually has an OpportunityID. Ideally the "Get My Applications" endpoint returns enriched data.
    // Let's assume for now we might only have ID, but UI needs Title.
    // If strictly following Schema, we only have IDs.
    // FOR THE PURPOSE OF THIS SLICE: I will type cast or assume the backend "My Applications" endpoint returns an aggregate.
    // If not, we would need to fetch Opportunity data for each card, which is N+1.
    // Let's proceed assuming the `application` object has extended fields or we just show what we have.

    // To be safe and "real", let's use what's likely available or fallback specific IDs.
    // In a real optimized system, list endpoints return joined data.

    const statusColors = {
        PENDING: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        ACCEPTED: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        REJECTED: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        CANCELLED: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
    };

    const status = application.status || "PENDING";
    const statusColor = statusColors[status as keyof typeof statusColors] || statusColors.PENDING;

    // TODO: Verify if backend populates 'opportunity' field.
    // If not, we might only show "Application to Opportunity #ID".
    const opportunityTitle = (application as any).opportunity?.title || `Opportunity #${application.opportunityId}`;
    const location = (application as any).opportunity?.location;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold truncate">
                    <Link href={`/opportunities/${application.opportunityId}`} className="hover:underline">
                        {opportunityTitle}
                    </Link>
                </CardTitle>
                <Badge variant="outline" className={statusColor}>
                    {status}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
                {location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" />
                        {location.city}, {location.country}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-md">
                    <div>
                        <span className="text-muted-foreground block text-xs">Dates</span>
                        <span className="font-medium flex items-center mt-1">
                            <Calendar className="mr-1 h-3 w-3" />
                            {application.applicationDetails?.startDate || "TBD"}
                            <span className="mx-1">→</span>
                            {application.applicationDetails?.endDate || "TBD"}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-xs">Applied On</span>
                        <span className="font-medium flex items-center mt-1">
                            <Clock className="mr-1 h-3 w-3" />
                            {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Unknown"}
                        </span>
                    </div>
                </div>

                <div className="text-sm border-l-2 pl-3 italic text-muted-foreground line-clamp-2">
                    "{application.applicationDetails?.message}"
                </div>

            </CardContent>
            <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/applications/${application.id}`}>View Status</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
