"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { CalendarDays, CalendarRange, Grid3x3, Calendar } from "lucide-react";

const ZOOM = [
  { href: "/", label: "Day", icon: CalendarDays },
  { href: "/week", label: "Week", icon: CalendarRange },
  { href: "/month", label: "Month", icon: Grid3x3 },
  { href: "/year", label: "Year", icon: Calendar },
];

export function ZoomSwitcher({ active }: { active: string }) {
  return (
    <div className="inline-flex items-center gap-0 border-2 border-black">
      {ZOOM.map((z) => {
        const Icon = z.icon;
        const isActive = active === z.label.toLowerCase();
        return (
          <Link
            key={z.href}
            href={z.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider transition",
              isActive
                ? "bg-[var(--acid)] text-black"
                : "bg-white text-black/40 hover:bg-black hover:text-white"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{z.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
