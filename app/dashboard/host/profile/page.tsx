"use client";

import { HostProfileForm } from "@/components/host/HostProfileForm";
import { useMyHost, useUpdateHost, useCreateHost } from "@/lib/hooks/useHost";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReviewList } from "@/components/reviews/ReviewList";

export default function HostProfilePage() {
    const { data: host, isLoading } = useMyHost();
    const { mutate: updateHost, isPending: isUpdating } = useUpdateHost();
    const { mutate: createHost, isPending: isCreating } = useCreateHost();
    const { toast } = useToast();

    // If host doesn't exist, we might be creating for the first time?
    // Or maybe the user is not a host yet.
    // Assuming this page is protected and only accessible if user intends to be a host.

    const handleSubmit = async (values: any) => {
        const payload = {
            name: values.name,
            description: values.description,
            location: {
                city: values.city,
                country: values.country,
            }
        };

        if (host) {
            updateHost({ id: host.id!, data: payload as any }, {
                onSuccess: () => toast({ title: "Profile updated successfully" }),
                onError: () => toast({ title: "Failed to update profile", variant: "destructive" })
            });
        } else {
            createHost(payload as any, {
                onSuccess: () => toast({ title: "Profile created successfully" }),
                onError: () => toast({ title: "Failed to create profile", variant: "destructive" })
            });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    return (
        <div className="container max-w-2xl py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Host Profile</h1>
                <p className="text-muted-foreground">Manage your organization's public profile.</p>
            </div>

            <HostProfileForm
                initialData={host}
                onSubmit={handleSubmit}
                isLoading={isUpdating || isCreating}
            />

            {host && (
                <div className="pt-10 border-t">
                    <h2 className="text-2xl font-bold mb-6">Received Reviews</h2>
                    <ReviewList targetId={host.id!} targetType="HOST" />
                </div>
            )}
        </div>
    );
}
