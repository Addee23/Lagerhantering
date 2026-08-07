"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/nav-items";

// skills/ui-and-mobile-rules.md: "Snabb sökning" - en enda sökruta i
// navigationen som täcker produkter, leverantörer, varumärken, inleveranser
// och reklamationer (se src/lib/search.ts). Vanlig GET-navigering till
// /search, ingen JS krävs för att söka.
function SearchBox({
  onNavigate,
  className = "mb-4",
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <form method="get" action="/search" onSubmit={onNavigate} className={className}>
      <input
        type="search"
        name="q"
        placeholder="Sök..."
        aria-label="Sök i hela systemet"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
      />
    </form>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Nav({ username }: { username: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobil: kompakt topprad med sökruta alltid synlig + hamburgermeny */}
      <header className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3 md:hidden dark:border-neutral-800">
        <Link href="/" className="shrink-0 font-semibold text-neutral-900 dark:text-neutral-50">
          Hela Rubbet
        </Link>
        <SearchBox className="min-w-0 flex-1" />
        <button
          type="button"
          aria-label="Öppna meny"
          onClick={() => setIsOpen(true)}
          className="shrink-0 rounded-md border border-neutral-300 p-2 dark:border-neutral-700"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-72 max-w-[80vw] overflow-y-auto bg-white p-4 dark:bg-neutral-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold text-neutral-900 dark:text-neutral-50">Meny</span>
              <button
                type="button"
                aria-label="Stäng meny"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-neutral-300 p-2 dark:border-neutral-700"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setIsOpen(false)} />
            <p className="mt-6 truncate text-xs text-neutral-400">Inloggad som {username}</p>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setIsOpen(false)} />
        </div>
      )}

      {/* Dator/surfplatta: permanent sidomeny */}
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200 p-4 md:flex md:flex-col dark:border-neutral-800">
        <Link href="/" className="mb-4 font-semibold text-neutral-900 dark:text-neutral-50">
          Hela Rubbet
        </Link>
        <SearchBox />
        <NavLinks />
        <p className="mt-auto truncate pt-4 text-xs text-neutral-400">Inloggad som {username}</p>
      </aside>
    </>
  );
}
