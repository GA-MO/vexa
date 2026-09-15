"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "vexa/react";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/orders", label: "Orders" },
  { href: "/settings", label: "Settings" },
  { href: "/guides", label: "Guides" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-12 max-w-5xl items-center gap-1 px-4 sm:px-6" aria-label="Main">
        <Link href="/" className="mr-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="size-2.5 rounded-full bg-gradient-to-br from-primary to-brand-violet" aria-hidden />
          Vexa Shop
        </Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              isActive(pathname, item.href)
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
