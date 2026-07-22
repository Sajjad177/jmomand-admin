'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '../../features/hook/userhook';
import { useSession } from 'next-auth/react';

export function TopHeader() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const { data: user } = useUserProfile({ token });

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={user?.image?.url} />
          <AvatarFallback>{user?.firstName?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
