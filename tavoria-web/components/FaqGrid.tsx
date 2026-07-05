"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

type Props = {
  items: FaqItem[];
};

/**
 * Two-column FAQ grid. No cards, no boxes — just brass hairlines between
 * rows. Question is serif italic 600. Answer is body sans. Plus/minus icon
 * sits on the right in brass.
 */
export default function FaqGrid({ items }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="grid gap-x-12 gap-y-0 md:grid-cols-2">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            className="border-b border-brass/30 first:border-t first:border-brass/30 md:[&:nth-child(2)]:border-t md:[&:nth-child(2)]:border-brass/30"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="group flex w-full cursor-pointer items-start justify-between gap-6 py-7 text-left"
            >
              <span className="font-serif text-[20px] font-semibold italic leading-snug text-navy sm:text-[22px]">
                {item.q}
              </span>
              <span
                aria-hidden="true"
                className="mt-2 inline-flex h-6 w-6 shrink-0 items-center justify-center text-brass transition-transform duration-200"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="2"
                    y1="7"
                    x2="12"
                    y2="7"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="7"
                    y1="2"
                    x2="7"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    className={`origin-center transition-transform duration-200 ${
                      isOpen ? "scale-y-0" : "scale-y-100"
                    }`}
                  />
                </svg>
              </span>
            </button>
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="pb-7 pr-8 text-[15px] leading-[1.65] text-mute">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
