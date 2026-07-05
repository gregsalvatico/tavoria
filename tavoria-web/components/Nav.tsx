"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "./Button";
import Wordmark from "./Wordmark";

const LINKS = [
  { href: "/per-locali", label: "Per locali" },
  { href: "/per-staff", label: "Per staff" },
  { href: "/prezzi", label: "Prezzi" },
  { href: "/fondatori", label: "Fondatori" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "bg-surface/80 backdrop-blur-md border-b border-ink/5 shadow-sm"
          : "bg-surface/0 border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-6 sm:h-20 sm:px-10">
        <Link
          href="/"
          aria-label="Tavoria — homepage"
          className="transition-opacity hover:opacity-80"
        >
          <Wordmark className="text-[22px]" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-underline text-[14px] font-medium text-ink/75 transition-colors hover:text-navy"
            >
              {l.label}
            </Link>
          ))}
          <span className="text-[11px] uppercase tracking-[0.22em] text-brass tnum">
            IT
          </span>
        </nav>

        <div className="hidden lg:block">
          <Button
            href="https://app.tavoriapp.com"
            external
            variant="orange"
            size="md"
            className="!h-11 !px-5 !text-sm"
          >
            Apri l&apos;app →
          </Button>
        </div>

        {/* Mobile trigger */}
        <button
          aria-label={open ? "Chiudi menu" : "Apri menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-navy lg:hidden"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {open ? (
              <path
                d="M4 4l10 10M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path
                  d="M2.5 5h13M2.5 9h13M2.5 13h13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-surface border-t border-ink/5">
          <div className="mx-auto flex w-full max-w-page flex-col gap-1 px-6 py-4 sm:px-10">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-ink/80 hover:bg-cream"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 px-1">
              <Button
                href="https://app.tavoriapp.com"
                external
                variant="orange"
                size="md"
                className="w-full"
              >
                Apri l&apos;app →
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
