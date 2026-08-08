import { Users } from "lucide-react";

export default function SidebarSkeleton() {
  const items = Array(6).fill(0);
  return (
    <aside className="h-full flex-none w-20 sm:w-24 md:w-64 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2"><Users className="w-6 h-6" /><span className="font-medium hidden lg:block">Contacts</span></div>
      </div>
      <div className="overflow-y-auto w-full py-3 flex flex-col justify-center">
        {items.map((_, i) => (
          <div key={i} className="w-full p-3 min-h-[4rem] flex flex-col items-center justify-center rounded-xl">
            <div className="skeleton size-12 rounded-full" />
            <div className="hidden lg:flex flex-col items-center text-center mt-3">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}