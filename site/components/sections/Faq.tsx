"use client";

import { useState } from "react";
import Image from "next/image";
import { faqs } from "@/content/site";

/**
 * Design geometry (1440px frame):
 *   heading  x=48 y=3420  37px Bold -1px, subtitle y=3461
 *   rows           y=3510+ two columns, question 13px SemiBold #555894,
 *                  a thin blue hairline and a "+" glyph on the right
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="pt-10 pb-10 xl:pt-[58px] xl:pb-[34px]">
      <div className="shell">
        <h2 className="h-section">Frequently asked questions</h2>
        <p className="sub-section">Quick answers to common questions.</p>

        <div className="mt-6 grid gap-x-[27px] gap-y-2 md:grid-cols-2 xl:mt-[24px] xl:gap-x-[44px] xl:gap-y-[10px]">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.q} className="h-fit rounded-[6px] border border-[rgba(152,195,240,0.6)] bg-white">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="focus-visible:outline-brand text-muted flex w-full items-center justify-between gap-4 px-[14px] py-2.5 text-left text-[12px] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 xl:h-[25px] xl:py-0 xl:text-[13px]"
                  >
                    {faq.q}
                    <Image
                      src="/icons/plus.svg"
                      alt=""
                      width={16}
                      height={16}
                      aria-hidden
                      className={"w-[13px] shrink-0 transition-transform " + (isOpen ? "rotate-45" : "")}
                    />
                  </button>
                </h3>
                {/*
                 * Animating grid-template-rows between 0fr and 1fr gives a
                 * smooth open/close without hard-coding a panel height, which
                 * a max-height transition would need.
                 */}
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-hidden={!isOpen}
                  className={
                    "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none " +
                    (isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")
                  }
                >
                  <div className="overflow-hidden">
                    <p className="text-muted px-[18px] pb-3 text-[12px] leading-[1.5] font-medium xl:text-[13px]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
