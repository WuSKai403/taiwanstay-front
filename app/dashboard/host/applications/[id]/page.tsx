"use client";

import { useApplication, useUpdateApplicationStatus } from "@/lib/hooks/useApplications";
import { usePublicProfile } from "@/lib/hooks/useProfile";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Check, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";

export default function HostApplicationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;

    const { data: application, isLoading: isAppLoading } = useApplication(applicationId);
    const { mutate: updateStatus, isPending: isUpdating } = useUpdateApplicationStatus();

    // Fetch applicant profile
    const userId = application?.userId;
    const { data: applicant, isLoading: isUserLoading } = usePublicProfile(userId || '');

    if (isAppLoading || (userId && isUserLoading)) {
        return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!application) {
        return <div className="p-20 text-center">Application not found</div>;
    }

    const handleStatusUpdate = (newStatus: string) => {
        updateStatus(
            { id: applicationId, status: newStatus },
            {
                onSuccess: () => {
                    toast.success(`Application marked as ${newStatus}`);
                },
                onError: () => {
                    toast.error("Failed to update status");
                }
            }
        );
    };

    return (
        <div className="container max-w-4xl py-6 space-y-6">
            <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Review Application</h1>
                    <p className="text-muted-foreground">Applicant: {applicant?.name || 'Loading...'}</p>
                </div>
                <Badge variant={application.status === 'PENDING' ? 'secondary' : 'outline'} className="text-lg px-4 py-1">
                    {application.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Applicant Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={applicant?.image} />
                                    <AvatarFallback>{applicant?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle>{applicant?.name}</CardTitle>
                            <CardDescription>{applicant?.profile?.location?.country || 'Unknown Location'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-sm">Skills</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {applicant?.profile?.skills?.map(skill => (
                                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                    )) || <span className="text-muted-foreground text-sm">No skills listed</span>}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-medium text-sm">Bio</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {applicant?.profile?.bio || 'No bio provided.'}
                                </p>
                            </div>
                            <Button variant="outline" className="w-full mt-4" onClick={() => router.push(`/users/${userId}`)}>
                                View Full Profile
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Application Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                                <div>
                                    <span className="text-sm text-muted-foreground">Start Date</span>
                                    <p className="font-medium">{application.applicationDetails?.startDate}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">End Date</span>
                                    <p className="font-medium">{application.applicationDetails?.endDate}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Language</span>
                                    <p className="font-medium">{application.applicationDetails?.languages?.join(', ')}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-muted-foreground">Duration</span>
                                    <p className="font-medium">{application.applicationDetails?.duration} Days</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Cover Letter</h3>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground border-l-4 border-primary/20 pl-4 py-2">
                                    {application.applicationDetails?.message}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            {application.status === 'PENDING' && (
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleStatusUpdate('ACCEPTED')}
                                        disabled={isUpdating}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Accept
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleStatusUpdate('REJECTED')}
                                        disabled={isUpdating}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                </div>
                            )}

                            {application.status === 'ACCEPTED' && (
                                <div className="pt-4">
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                        onClick={() => handleStatusUpdate('COMPLETED')}
                                        disabled={isUpdating}
                                    >
                                        <CheckSquare className="w-4 h-4 mr-2" /> Mark as Completed
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-2">
                                        Mark as completed after the volunteer successfully finishes their stay.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
