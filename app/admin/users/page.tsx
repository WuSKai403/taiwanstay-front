"use client";

import { useAdminUsers, useUpdateUserStatus } from "@/lib/hooks/useAdmin";
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
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
    const { data, isLoading, isError } = useAdminUsers({ limit: 50 });
    const { mutate: updateStatus, isPending: isUpdating } = useUpdateUserStatus();
    const { toast } = useToast();

    const handleStatusChange = (id: string, currentStatus?: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        updateStatus({ id, status: newStatus }, {
            onSuccess: () => toast({ title: `User ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}` }),
            onError: () => toast({ title: "Failed to update status", variant: "destructive" })
        });
    };

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (isError) return <div className="p-8 text-center text-red-500">Failed to load users</div>;

    const users = data?.users || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">Manage authorized users ({data?.total || 0}).</p>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                            {user.name?.charAt(0) || 'U'}
                                        </div>
                                        {user.name}
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{user.role}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {user.createdAt && format(new Date(user.createdAt), 'yyyy-MM-dd')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleStatusChange(user.id!, user.status)}
                                        disabled={isUpdating}
                                        title={user.status === 'ACTIVE' ? "Suspend User" : "Activate User"}
                                    >
                                        {user.status === 'ACTIVE' ? <ShieldAlert className="w-4 h-4 text-destructive" /> : <ShieldCheck className="w-4 h-4 text-green-600" />}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
