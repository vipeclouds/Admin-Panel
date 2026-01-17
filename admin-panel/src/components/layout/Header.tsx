"use client";

import { useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/auth";

export default function Header() {
  const router = useRouter();

  const handleSignOut = () => {
    clearAdminToken();
    router.replace("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm font-medium text-slate-600">Admin</div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-500">Signed in as Admin</div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
