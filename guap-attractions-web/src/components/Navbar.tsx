"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Маршруты" },
  { href: "/quizzes", label: "Викторины" },
  { href: "/links", label: "Полезные ссылки" },
  { href: "/profile", label: "Личный кабинет" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/profile") return pathname.startsWith("/profile") || pathname.startsWith("/auth");
    return pathname.startsWith(href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-[color:var(--guap-header-accent-line)] bg-guap-nav shadow-[var(--shadow-nav)] transition-colors duration-300">
      <div
        className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 sm:gap-4"
        style={{ height: "var(--header-height, 55px)" }}
      >
        <Link
          href="/"
          className="flex h-full min-w-0 max-w-[calc(100%-7rem)] items-center gap-2 overflow-hidden sm:max-w-[min(100%,26rem)] sm:gap-3 lg:max-w-none lg:flex-1"
        >
          <Image
            src="/s_guap-sign.png"
            alt="ГУАП"
            width={120}
            height={40}
            className="h-9 w-auto max-w-[100px] shrink-0 object-contain sm:h-10 sm:max-w-[120px]"
            priority
          />
          <span className="min-w-0 truncate text-[12px] font-semibold leading-snug tracking-tight text-guap-heading sm:whitespace-normal sm:text-[15px] sm:leading-tight">
            Достопримечательности вокруг ГУАП
          </span>
        </Link>

        <div className="relative z-10 hidden h-full shrink-0 items-stretch gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full items-center border-b-2 border-transparent px-3 text-[13px] font-medium transition-colors duration-[400ms] ease-in-out lg:px-4 ${
                  active
                    ? "border-suai-brand text-guap-heading"
                    : "text-[var(--nav-text)] hover:text-[var(--nav-text-hover)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="flex items-center pl-1">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-suai hover:bg-guap-hover"
            aria-label="Открыть меню"
          >
            <span
              className={`block h-0.5 w-5 bg-[var(--nav-text)] transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-[var(--nav-text)] transition-opacity ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-[var(--nav-text)] transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-suai-border bg-guap-nav px-4 pb-4 pt-2 sm:hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-suai px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-l-2 border-suai-brand bg-guap-hover text-guap-heading"
                    : "text-[var(--nav-text)] hover:bg-guap-hover hover:text-[var(--nav-text-hover)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
