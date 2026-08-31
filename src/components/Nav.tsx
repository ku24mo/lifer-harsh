"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Grid3x3,
  Calendar,
  BookOpen,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Day", icon: CalendarDays },
  { href: "/week", label: "Week", icon: CalendarRange },
  { href: "/month", label: "Month", icon: Grid3x3 },
  { href: "/year", label: "Year", icon: Calendar },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/gym", label: "Workout", icon: Dumbbell },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      {/* Bottom bar — all screens, bold wordmark + nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t-2 border-black bg-white safe-bottom">
        <div className="mx-auto max-w-6xl flex items-stretch">
          {/* Wordmark — bold, left */}
          <Link
            href="/"
            className="hidden sm:flex flex-col justify-center px-5 py-2.5 border-r-2 border-black shrink-0"
          >
            <span className="text-[20px] font-bold tracking-tighter leading-none text-black">
              Harsh
            </span>
            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.2em]">
              <span className="bg-[var(--acid)] px-1 py-0.5 text-black">Why not you?</span>
            </span>
          </Link>

          {/* Mobile wordmark — compact */}
          <Link
            href="/"
            className="sm:hidden flex items-center px-3 py-2.5 border-r-2 border-black shrink-0"
          >
            <span className="text-[18px] font-bold tracking-tighter leading-none text-black">
              Harsh
            </span>
          </Link>

          {/* Nav buttons */}
          <div className="flex flex-1 items-stretch justify-around sm:justify-center sm:gap-0">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 sm:flex-none flex-col items-center justify-center gap-0.5 sm:gap-1 sm:px-4 py-2.5 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider transition",
                    active ? "bg-[var(--acid)] text-black" : "text-black/50 hover:text-black"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

export function ContentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-dvh">
      <main className="flex-1 pb-20">{children}</main>
    </div>
  );
}
