"use client";

import { usePublicProfile } from "@/lib/hooks/useProfile";
import { useOpportunities } from "@/lib/hooks/useOpportunities";
import { useParams } from "next/navigation";
import { Loader2, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OpportunityCard } from "@/components/opportunity/OpportunityCard";
import { ReviewList } from "@/components/reviews/ReviewList";

export default function PublicProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const { data: user, isLoading } = usePublicProfile(userId);

    // If user is a host, fetch their opportunities
    const isHost = user?.role === "HOST";
    const { data: opportunities } = useOpportunities(isHost ? { hostId: userId } : {});

    if (isLoading) {
        return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!user) {
        return <div className="p-20 text-center">User not found</div>;
    }

    return (
        <div className="container max-w-5xl py-10 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                        <AvatarImage src={user.image} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                            {user.name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="flex-1 space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            {user.name}
                            {/* Assuming verified status is available, else mock or check logic */}
                            <CheckCircle2 className="w-6 h-6 text-blue-500" />
                        </h1>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                            {(user.profile?.personalInfo?.currentLocation || user.profile?.personalInfo?.nationality) && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{user.profile.personalInfo.currentLocation || user.profile.personalInfo.nationality}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Joined {new Date(user.createdAt || "").getFullYear()}</span>
                            </div>
                        </div>
                    </div>

                    {user.profile?.bio && (
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {user.profile.bio}
                        </p>
                    )}

                    {/* Volunteer Skills */}
                    {user.role === "USER" && user.profile?.skills && (
                        <div className="flex flex-wrap gap-2">
                            {user.profile.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* Host Section: Opportunities */}
            {isHost && opportunities && opportunities.length > 0 && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-primary">Active Opportunities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {opportunities.map(opp => (
                            <OpportunityCard key={opp.id} opportunity={opp as any} />
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews Section Placeholder */}
            {/* Note: We would list reviews here. For Hosts, we could aggregate reviews from their opportunities. */}
            {/* Reviews Section */}
            <div className="space-y-6">
                <ReviewList targetId={userId} targetType="HOST" />
            </div>
        </div>
    );
}
