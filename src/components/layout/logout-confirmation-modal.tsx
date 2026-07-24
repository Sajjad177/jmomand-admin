"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOutIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LogoutConfirmationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogoutConfirmationModal({
  open,
  onOpenChange,
}: LogoutConfirmationModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] gap-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-2xl">
        <div className="px-6 pt-6">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/60">
            <LogOutIcon className="h-5 w-5" />
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-950">
              Confirm logout
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-500">
              Are you sure you want to log out? You will need to sign in again
              to access the admin dashboard.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="mt-6 border-t border-slate-100 bg-slate-50/80 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoggingOut}
            className="h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-10 bg-red-600 text-white hover:bg-red-700"
          >
            <LogOutIcon className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Yes, log out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
