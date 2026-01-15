"use client";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm font-medium text-slate-600">Admin</div>
      <div className="text-sm text-slate-500">Signed in as Admin</div>
    </header>
  );
}
