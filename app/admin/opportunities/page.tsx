"use client";

// Reusing general opportunities hook but normally would use Admin specific one with more filters
import { useOpportunities } from "@/lib/hooks/useOpportunities";
import { useUpdateOpportunityStatus } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Check, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function AdminOpportunitiesPage() {
    // Fetch all opportunities
    const { data: opportunities, isLoading } = useOpportunities({});
    const { mutate: updateStatus, isPending: isUpdating } = useUpdateOpportunityStatus();
    const { toast } = useToast();

    const handleStatusChange = (id: string, status: string) => {
        updateStatus({ id, status }, {
            onSuccess: () => toast({ title: `Opportunity updated to ${status}` }),
            onError: () => toast({ title: "Failed to update status", variant: "destructive" })
        });
    };

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    // Filter/Sort logic could be added here

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
                <p className="text-muted-foreground">Manage all listings.</p>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {opportunities?.map((opp) => (
                            <TableRow key={opp.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{opp.title}</span>
                                        <Link href={`/opportunities/${opp.id}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:underline">
                                            View public listing <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">{opp.hostId}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        opp.status === 'ACTIVE' ? 'default' :
                                            opp.status === 'PENDING' ? 'secondary' : 'outline'
                                    }>
                                        {opp.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {opp.status === 'PENDING' && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatusChange(opp.id!, 'ACTIVE')}>
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleStatusChange(opp.id!, 'REJECTED')}>
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {opp.status === 'ACTIVE' && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(opp.id!, 'ADMIN_PAUSED')}>
                                                Pause
                                            </Button>
                                        )}
                                        {opp.status === 'ADMIN_PAUSED' && (
                                            <Button size="sm" variant="outline" onClick={() => handleStatusChange(opp.id!, 'ACTIVE')}>
                                                Activate
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
