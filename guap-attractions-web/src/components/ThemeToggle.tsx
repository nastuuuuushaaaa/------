"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useTheme } from "@/components/ThemeProvider";

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function subscribeThemeClass(cb: () => void) {
  const el = document.documentElement;
  const mo = new MutationObserver(cb);
  mo.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}

function isDarkDom(): boolean {
  return document.documentElement.classList.contains("dark");
}

export default function ThemeToggle() {
  const { toggle } = useTheme();
  const isDark = useSyncExternalStore(subscribeThemeClass, isDarkDom, () => false);

  const onClick = useCallback(() => {
    toggle();
  }, [toggle]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      aria-pressed={isDark}
      suppressHydrationWarning
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--nav-text)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--nav-text-hover)] dark:border-[var(--suai-default-border)] dark:text-[#f8d347] dark:hover:bg-[#2a3038] dark:hover:text-[#f8d347]"
    >
      {isDark ? (
        <SunIcon className="opacity-90" />
      ) : (
        <MoonIcon className="text-[#f8d347]" />
      )}
    </button>
  );
}
