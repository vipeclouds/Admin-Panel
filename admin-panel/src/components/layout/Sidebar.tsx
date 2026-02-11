"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin/sales", label: "Sales Dashboard" },
  { href: "/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
  { href: "/variants", label: "Variants" },
  { href: "/admin/homepage-control", label: "HomePage Control" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/faqs", label: "Admin FAQs" },
  { href: "/admin/promo-codes", label: "Promo Codes" },
  { href: "/admin/terms-conditions", label: "Terms & Conditions" },
  { href: "/admin/privacy-policy", label: "Privacy Policy" },
  { href: "/admin/users", label: "Users" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <div className="flex h-16 items-center px-6 text-lg font-semibold text-slate-900">
        Admin Panel
      </div>
      <nav className="px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
