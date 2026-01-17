"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Settings, BarChart3, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const navigationItems = [
  {
    name: "Категорії",
    href: "/categories",
    icon: LayoutDashboard,
  },
  {
    name: "Метрики",
    href: "/metrics",
    icon: BarChart3,
  },
  {
    name: "Користувачі",
    href: "/users",
    icon: Users,
  },
  {
    name: "Налаштування",
    href: "/settings",
    icon: Settings,
  },
];

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">СЕРАФІМ</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};
