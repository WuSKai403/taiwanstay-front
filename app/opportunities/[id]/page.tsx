"use client";

import { useState } from "react";
import { useOpportunity } from "@/lib/hooks/useOpportunities";
import { useCreateApplication } from "@/lib/hooks/useApplications";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Clock, CheckCircle2, Globe, Share2, Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ApplicationApplyModal } from "@/components/application/ApplicationApplyModal";

export default function OpportunityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    const { data: opportunity, isLoading } = useOpportunity(id);
    const { mutate: apply, isPending: isApplying } = useCreateApplication();

    const handleApplyClick = () => {
        setIsApplyModalOpen(true);
    };

    const handleApplicationSubmit = (formData: { message: string; startDate: string; endDate: string }) => {
        if (!opportunity) return;

        apply({
            opportunityId: opportunity.id || id,
            hostId: opportunity.hostId,
            applicationDetails: {
                message: formData.message,
                startDate: formData.startDate,
                endDate: formData.endDate,
            }
        }, {
            onSuccess: () => {
                toast.success("Application submitted successfully!");
                setIsApplyModalOpen(false);
            },
            onError: (err) => {
                toast.error(`Failed to apply: ${err.message}`);
                // Don't close modal on error so user can retry
            }
        });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!opportunity) {
        // In a real app we might redirect or show a nice 404 component
        return <div className="container py-20 text-center">Opportunity not found</div>;
    }

    const {
        title,
        description,
        location,
        media,
        type,
        workDetails,
        benefits,
        hostId
    } = opportunity as any;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Image */}
            <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
                <img
                    src={media?.coverImage?.secureUrl || "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?q=80&w=2574&auto=format&fit=crop"}
                    alt={title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 container p-6 md:p-10 text-white">
                    <Badge className="mb-4 bg-secondary text-secondary-foreground hover:bg-secondary/90 text-md px-3 py-1">
                        {type?.replace("_", " ")}
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-bold mb-2">{title}</h1>
                    <div className="flex items-center gap-2 text-lg opacity-90">
                        <MapPin className="w-5 h-5" />
                        <span>{location?.city}, {location?.country}</span>
                    </div>
                </div>
            </div>

            <div className="container mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Host Info (Simplified) */}
                    <div className="flex items-center gap-4 p-6 bg-card rounded-xl border shadow-sm">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src="" />
                            <AvatarFallback>H</AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-lg font-semibold">Hosted by {hostId || "Host"}</h3>
                            <p className="text-muted-foreground text-sm">Joined 2023 • Verified Host</p>
                        </div>
                        <Button variant="outline" className="ml-auto">View Profile</Button>
                    </div>

                    {/* Description */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4">About this opportunity</h2>
                        <div className="prose max-w-none text-muted-foreground whitespace-pre-line">
                            {description}
                        </div>
                    </section>

                    {/* Work Details */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Help needed</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {workDetails?.tasks?.map((task: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                                    <span>{task}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Benefits */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4">What's included</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {benefits?.accommodation?.provided && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            🏠 Accommodation
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        {benefits.accommodation.type?.replace("_", " ")}
                                    </CardContent>
                                </Card>
                            )}
                            {benefits?.meals?.provided && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            🍽️ Meals
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        {benefits.meals.count} meals per day
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="sticky top-24 shadow-lg border-primary/10">
                        <CardHeader>
                            <CardTitle>Availability</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="w-4 h-4" /> Min Stay
                                    </span>
                                    <span className="font-medium">2 weeks</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="w-4 h-4" /> Availability
                                    </span>
                                    <span className="font-medium text-green-600">Open now</span>
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button className="w-full text-lg py-6" size="lg" onClick={handleApplyClick}>
                                    Apply Now
                                </Button>
                                <Button variant="outline" className="w-full gap-2">
                                    <Heart className="w-4 h-4" /> Save to wishlist
                                </Button>
                            </div>

                            <div className="text-xs text-center text-muted-foreground pt-2">
                                Free to contact. No hidden fees.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ApplicationApplyModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                onSubmit={handleApplicationSubmit}
                isSubmitting={isApplying}
                opportunityTitle={title}
            />
        </div>
    );
}

