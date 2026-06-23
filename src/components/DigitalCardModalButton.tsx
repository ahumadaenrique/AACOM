"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import DigitalCard from "./DigitalCard";
import { QrCode } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface DigitalCardModalButtonProps {
    user: any;
    agencyName: string;
}

export default function DigitalCardModalButton({ user, agencyName }: DigitalCardModalButtonProps) {
    const [open, setOpen] = useState(false);

    // Merge agencyName inside the user payload
    const payload = { ...user, agencyName };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem 
                    onSelect={(e) => {
                        e.preventDefault(); // Prevent dropdown from closing immediately
                        setOpen(true);
                    }}
                    className="text-xs font-bold text-slate-700 dark:text-zinc-300 py-2.5 rounded-xl cursor-pointer"
                >
                    <div className="flex items-center gap-1.5 w-full">
                        <QrCode className="h-4 w-4 text-indigo-600" />
                        Mi Tarjeta Digital
                    </div>
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
                <DigitalCard user={payload} />
            </DialogContent>
        </Dialog>
    );
}
