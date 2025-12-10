"use client";

import { OpportunityForm, OpportunityFormValues } from "@/components/opportunity/OpportunityForm";
import { useOpportunity, useUpdateOpportunity } from "@/lib/hooks/useOpportunities";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Opportunity } from "@/lib/schemas/opportunity";

export default function EditOpportunityPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { toast } = useToast();

    const { data: opportunity, isLoading: isFetching } = useOpportunity(id);
    const { mutate: updateOpportunity, isPending: isUpdating } = useUpdateOpportunity(id);

    const onSubmit = async (values: OpportunityFormValues) => {
        const payload = {
            title: values.title,
            description: values.description,
            shortDescription: values.description.substring(0, 150),
            type: values.type,
            location: {
                city: values.city,
                country: values.country,
            },
            media: {
                coverImage: {
                    url: values.coverImage,
                }
            }
        };

        updateOpportunity(payload as any, {
            onSuccess: () => {
                toast({ title: "Opportunity updated successfully" });
                router.push("/dashboard/opportunities");
            },
            onError: (error) => {
                console.error(error);
                toast({ title: "Failed to update opportunity", variant: "destructive" });
            }
        });
    };

    if (isFetching) {
        return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!opportunity) {
        return <div>Opportunity not found</div>;
    }

    return (
        <div className="container max-w-2xl py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/opportunities"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <h1 className="text-3xl font-bold">Edit Opportunity</h1>
            </div>

            <OpportunityForm
                initialData={opportunity as unknown as Opportunity}
                onSubmit={onSubmit}
                isLoading={isUpdating}
                submitLabel="Update Opportunity"
            />
        </div>
    );
}
