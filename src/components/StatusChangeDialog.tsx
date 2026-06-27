"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  fromStatus: string;
  toStatus: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function StatusChangeDialog({ open, fromStatus, toStatus, onConfirm, onCancel }: Props) {
  const [typedText, setTypedText] = useState("");
  const isConfirmed = typedText === toStatus;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change status to "{toStatus}"?</DialogTitle>
          <DialogDescription>
            Type "{toStatus}" exactly to confirm this change.
            {["Offer", "Rejected"].includes(toStatus) && (
              <p className="mt-2 text-sm text-amber-600">
                This will also clear the follow-up reminder for this application.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <Input
            placeholder={`Type "${toStatus}"`}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            className="flex-1"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!isConfirmed}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}