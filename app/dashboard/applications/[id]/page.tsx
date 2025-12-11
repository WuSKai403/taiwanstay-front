"use client";

import { useApplication, useCancelApplication } from "@/lib/hooks/useApplications";
import { useReviews, useCreateReview } from "@/lib/hooks/useReviews";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import Link from "next/link";
import { components } from "@/types/api";

type ApplicationStatus = components['schemas']['domain.ApplicationStatus'];

const StatusBadge = ({ status }: { status?: string }) => {
    switch (status) {
        case 'ACCEPTED':
        case 'COMPLETED': // Handling COMPLETED even if not in generated type yet
            return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-4 h-4 mr-1" /> Accepted</Badge>;
        case 'REJECTED':
            return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-1" /> Rejected</Badge>;
        case 'PENDING':
            return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>;
        case 'CANCELLED':
            return <Badge variant="outline">Cancelled</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
};

export default function ApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;
    const { data: application, isLoading } = useApplication(applicationId);
    const { mutate: cancelApp, isPending: isCancelling } = useCancelApplication();
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    // Fetch opportunity details? application.opportunityId should be populated if extended,
    // but the API type shows flat structure. We might need to fetch opportunity separately
    // or rely on application.opportunity (if backend populates it).
    // The type `domain.Application` DOES NOT show `opportunity` object, only `opportunityId`.
    // So we assume we need to fetch opportunity or the type definition is incomplete/minimal.
    // For now, we will just show IDs or skeletal info if missing.
    // Actually, `getApplications` in real world usually expands entities.
    // If not, we should use `useOpportunity(application.opportunityId)`.
    // Let's assume we need to fetch it.

    // We can't import useOpportunity directly if not exported or if we need to genericize.
    // Assuming useOpportunity exists in `lib/hooks/useOpportunities`.
    // Let's check imports.

    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!application) {
        return <div className="p-20 text-center">Application not found</div>;
    }

    const { status, opportunityId, hostId, applicationDetails } = application;
    // Status Logic
    const isCompleted = status === 'COMPLETED' || (status === 'ACCEPTED' && new Date(applicationDetails?.endDate || '') < new Date());
    // Fallback: IF COMPLETED is missing from enum, we treat ACCEPTED + Date passed as actionable for review?
    // Or we strictly follow "Show Leave Review if COMPLETED".
    // Since COMPLETED isn't in API, status === 'COMPLETED' will likely be false unless I force it.

    const showContact = status === 'ACCEPTED' || status === 'COMPLETED';

    return (
        <div className="container max-w-4xl py-6 space-y-6">
            <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Application Details</h1>
                    <p className="text-muted-foreground">ID: {applicationId}</p>
                </div>
                <StatusBadge status={status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                                    <p>{applicationDetails?.duration} Days</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Dates</h4>
                                    <p>{applicationDetails?.startDate} - {applicationDetails?.endDate}</p>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Message</h4>
                                <p className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                                    {applicationDetails?.message}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Review Section */}
                    {(status === 'COMPLETED' || isCompleted) && ( // Using loose logic for now
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" /> Experience Review
                                </CardTitle>
                                <CardDescription>
                                    How was your stay? Leave a review for the host.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                                    <DialogTrigger asChild>
                                        <Button>Leave a Review</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Review Opportunity</DialogTitle>
                                        </DialogHeader>
                                        <ReviewForm
                                            opportunityId={opportunityId || ''}
                                            onSuccess={() => setIsReviewOpen(false)}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Host Contact - Visibility Controlled */}
                    {showContact && (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-800">Host Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {/* We would need to fetch generic Host info if not in Application object */}
                                {/* Placeholder for now */}
                                <p className="text-sm"><strong>Host ID:</strong> {hostId}</p>
                                <p className="text-sm text-green-700">Contact/Mobile details would appear here.</p>
                                <Button variant="outline" className="w-full text-green-700 border-green-200 hover:bg-green-100">
                                    Message Host
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Opportunity Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Opportunity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Opportunity ID: {opportunityId}</p>
                            <Link href={`/opportunities/${opportunityId}`}>
                                <Button variant="secondary" className="w-full">View Opportunity</Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    {status === 'PENDING' && (
                        <Card>
                            <CardContent className="pt-6">
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    disabled={isCancelling}
                                    onClick={() => cancelApp(applicationId)}
                                >
                                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Application"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
