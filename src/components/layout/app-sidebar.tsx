"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  BoxIcon,
  EyeIcon,
  GavelIcon,
  GridIcon,
  LogOutIcon,
  SettingsIcon,
  TruckIcon,
  WalletIcon,
} from "@/components/ui/icons";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/dashboard/users", label: "Users", icon: EyeIcon },
  { href: "/dashboard/inventory", label: "Inventory", icon: BoxIcon },
  { href: "/dashboard/auctions", label: "Auctions", icon: GavelIcon },
  {href: "/dashboard/pickup-request",label: "Pickup Request",icon: TruckIcon,},
  { href: "/dashboard/orders", label: "Orders", icon: BoxIcon },
  { href: "/dashboard/invoices", label: "Invoices", icon: WalletIcon },
  { href: "/dashboard/payments", label: "Payments", icon: WalletIcon },
  { href: "/dashboard/reports", label: "Reports", icon: GridIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const displayName = session?.user?.name || session?.user?.email || "Admin";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#061f42] text-white lg:flex">
          
     <div>
        <Link
          href="/dashboard"
          className="flex items-center justify-center   gap-2"
        >
          <Image src={"/logo.png"} alt="Logo" width={100} height={100} />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-5 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-300 transition-colors",
                active &&
                  "bg-orange-600 text-white shadow-sm shadow-orange-950/20",
                !active && "hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 px-5 pb-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-slate-100 text-slate-900">
            {initials}
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs capitalize text-slate-300">
              {session?.user?.role || "Admin"}
            </p>
          </div>
        </div>

        <Button
          onClick={() => signOut({ callbackUrl: "/login" })}
          variant="outline"
          className="h-10 w-full border-orange-500/70 bg-transparent text-orange-400 hover:bg-orange-500 hover:text-white"
        >
          <LogOutIcon />
          Log out
        </Button>
      </div>
            
    </aside>
  );
}
