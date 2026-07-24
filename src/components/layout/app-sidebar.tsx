'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogoutConfirmationModal } from '@/components/layout/logout-confirmation-modal';
import {
  BoxIcon,
  EyeIcon,
  GavelIcon,
  GridIcon,
  LogOutIcon,
  SettingsIcon,
  TruckIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: GridIcon },
  { href: '/dashboard/users', label: 'Users', icon: EyeIcon },
  { href: '/dashboard/inventory', label: 'Inventory', icon: BoxIcon },
  // { href: "/dashboard/categories", label: "Categories", icon: GridIcon },
  { href: '/dashboard/auctions', label: 'Auctions', icon: GavelIcon },
  { href: '/dashboard/pickup-request', label: 'Pickup Request', icon: TruckIcon },
  { href: '/dashboard/orders', label: 'Orders', icon: BoxIcon },
  { href: '/dashboard/invoices', label: 'Invoices', icon: WalletIcon },
  { href: '/dashboard/payments', label: 'Payments', icon: WalletIcon },
  { href: '/dashboard/reports', label: 'Reports', icon: GridIcon },
  { href: '/dashboard/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const displayName = session?.user?.name || session?.user?.email || 'Admin';
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden bg-[#061f42] text-white shadow-2xl shadow-slate-950/20 lg:flex">
      <div className="border-b border-white/10 px-6 py-5">
        <Link
          href="/dashboard"
          className="flex h-14 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-white/10 transition hover:bg-white/[0.06]"
        >
          <Image
            src="/logo.png"
            alt="JMomand Admin"
            width={112}
            height={112}
            priority
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Main Menu
        </p>
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 outline-none transition-all duration-200',
                  'hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-orange-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061f42]',
                  active &&
                    'bg-orange-600 text-white shadow-lg shadow-orange-950/30 hover:bg-orange-600',
                )}
              >
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/0 transition-colors',
                    active && 'bg-white',
                  )}
                />
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-slate-300 transition-colors',
                    'group-hover:bg-white/10 group-hover:text-white',
                    active && 'bg-white/15 text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 bg-slate-950/10 px-4 py-5">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
          <Avatar className="h-10 w-10 bg-white text-slate-900 ring-2 ring-white/20">
            <AvatarFallback className="bg-white text-sm font-bold text-[#061f42]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5 text-white">{displayName}</p>
            <p className="truncate text-xs capitalize leading-4 text-slate-300">
              {session?.user?.role || 'Admin'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setLogoutOpen(true)}
          variant="outline"
          className="h-10 w-full border-white/10 bg-white/[0.04] border border-red-800   text-red-700"
        >
          <LogOutIcon className="h-4 w-4 text-red-500" />
          Log out
        </Button>
      </div>
      <LogoutConfirmationModal open={logoutOpen} onOpenChange={setLogoutOpen} />
    </aside>
  );
}
