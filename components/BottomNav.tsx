"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", icon: "🏠", label: "خانه" },
  { href: "/practice", icon: "🎵", label: "تمرین‌ها" },
  { href: "/history", icon: "📅", label: "تاریخچه" },
  { href: "/wallet", icon: "💰", label: "کیف پول" },
  { href: "/settings", icon: "⚙️", label: "تنظیمات" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-around px-1 py-2">
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}