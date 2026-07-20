import { Avatar } from "@/components/ui/avatar";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">J Momand Admin</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-950">Dashboard</h1>
      </div>

      <div className="flex items-center gap-3">

        <Avatar className="bg-[#061f42] text-white">DM</Avatar>
      </div>
    </header>
  );
}
