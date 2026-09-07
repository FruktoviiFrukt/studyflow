"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import Navigation from "./Navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" aria-label="Открыть меню" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 md:hidden"><Menu aria-hidden="true" size={22} /></button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="left-0 top-0 flex h-dvh w-[min(20rem,90vw)] translate-x-0 translate-y-0 flex-col rounded-none bg-white p-5 text-gray-900 sm:rounded-none">
        <DialogTitle className="mb-4 text-lg">Меню</DialogTitle>
        <Navigation onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
