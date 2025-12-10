import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useUpdateApplicationStatus } from "@/lib/hooks/useApplications";

interface ApplicationActionDialogProps {
    applicationId: string;
    applicantName: string;
    action: 'ACCEPT' | 'REJECT';
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApplicationActionDialog({
    applicationId,
    applicantName,
    action,
    isOpen,
    onOpenChange,
}: ApplicationActionDialogProps) {
    const [note, setNote] = useState("");
    const updateStatus = useUpdateApplicationStatus();

    const handleAction = async () => {
        try {
            await updateStatus.mutateAsync({
                id: applicationId,
                status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
                note,
            });
            onOpenChange(false);
            setNote("");
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    const isAccept = action === 'ACCEPT';

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isAccept ? "接受申請" : "拒絕申請"}
                    </DialogTitle>
                    <DialogDescription>
                        您確定要{isAccept ? "接受" : "拒絕"} <strong>{applicantName}</strong> 的申請嗎？
                        {isAccept
                            ? "接受後將自動通知申請者，請確保您已準備好接待。"
                            : "拒絕後將無法復原，申請者將收到通知。"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="note">
                            {isAccept ? "給志工的訊息 (選填)" : "拒絕原因 (選填)"}
                        </Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={isAccept ? "期待你的到來！" : "很抱歉..."}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button
                        variant={isAccept ? "default" : "destructive"}
                        onClick={handleAction}
                        disabled={updateStatus.isPending}
                    >
                        {updateStatus.isPending ? "處理中..." : (isAccept ? "確認接受" : "確認拒絕")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
