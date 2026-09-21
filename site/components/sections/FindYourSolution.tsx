"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { concerns, treatments } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Design geometry (1440px frame):
 *   heading  x=48 y=810   37px Bold #0b057d -1px
 *   subtitle       y=847  25px Medium #555894
 *   tabs           y=893  400×60, radius 10, 10px apart
 *                  active  bg #0399b2, label 27px SemiBold white
 *                  idle    bg #e7f6fd, 2px #bad1e7 border, label #0b057d
 *   cards          430×341, radius 15, bg #fefefe, 1px #afcee7, 27px gutter
 *                  image 430×230 flush to the top corners
 *                  title 23px Bold #0b057d / blurb 17px Medium #555894
 *                  link  18px Bold #0b057d -1px
 *
 * page1 and page2 in Figma are the two states of this toggle, not two pages.
 */
type Tab = "treatment" | "concern";

const TABS = [
  { id: "treatment", label: "Search by Dental Treatment" },
  { id: "concern", label: "Search by Dental Concern" },
] as const;

export function FindYourSolution() {
  const [tab, setTab] = useState<Tab>("treatment");

  return (
    <section id="treatments" className="scroll-mt-40 py-10 xl:pt-[58px] xl:pb-0">
      <div className="shell">
        <h2 className="h-section">Find Your Solution</h2>
        <p className="sub-section">Choose how you’d like to explore our services.</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 xl:mt-[21px]">
          <div role="tablist" aria-label="How to explore services" className="flex flex-nowrap gap-2 sm:gap-2.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={cn(
                  "focus-visible:outline-brand h-[40px] flex-1 rounded-[10px] px-2 text-[11px] font-semibold tracking-[-1px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-[44px] sm:flex-none sm:px-4 sm:text-[13px] md:h-[52px] md:px-6 md:text-[18px] xl:h-[60px] xl:w-[400px] xl:px-0 xl:text-[27px]",
                  tab === t.id
                    ? "bg-brand text-white"
                    : "bg-tab-bg border-tab-border text-ink border-2 hover:brightness-[0.98]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Link href="#treatments" className="link-more">
            {tab === "treatment" ? "View all treatments" : "View all dental concerns"}
            <Image src="/icons/arrow-sm.svg" alt="" width={20} height={17} aria-hidden className="w-[15px] xl:w-[20px]" />
          </Link>
        </div>

        {tab === "treatment" ? (
          <div
            role="tabpanel"
            id="panel-treatment"
            aria-labelledby="tab-treatment"
            className="mt-6 grid gap-x-[27px] gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:mt-[27px] xl:gap-y-[20px]"
          >
            {treatments.map((item) => (
              <article
                key={item.title}
                className="border-card-border bg-card-bg group overflow-hidden rounded-[15px] border transition-shadow hover:shadow-md xl:h-[346px]"
              >
                <div className="relative aspect-[430/230] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 430px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="px-[25px] pt-[15px] pb-[10px]">
                  <h3 className="text-ink text-[18px] leading-[25px] font-bold xl:text-[23px]">{item.title}</h3>
                  <p className="text-muted mt-1.5 text-[14px] font-medium xl:mt-[7px] xl:text-[17px] xl:leading-[22px]">{item.blurb}</p>
                  <Link
                    href="#treatments"
                    className="text-ink mt-3 inline-flex items-center gap-2 text-[14px] font-bold tracking-[-1px] transition-opacity hover:opacity-70 xl:mt-[14px] xl:text-[18px] xl:leading-[20px]"
                  >
                    {item.cta}
                    <Image
                      src="/icons/card-arrow.svg"
                      alt=""
                      width={15}
                      height={12}
                      aria-hidden
                      className="w-[13px] transition-transform group-hover:translate-x-0.5 xl:w-[15px]"
                    />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div
            role="tabpanel"
            id="panel-concern"
            aria-labelledby="tab-concern"
            className="mt-6 grid gap-x-[27px] gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:mt-[27px] xl:gap-x-[14px] xl:gap-y-[10px]"
          >
            {concerns.map((item) => (
              <article
                key={item.title}
                className="border-card-border bg-card-bg group flex items-center gap-4 rounded-[15px] border px-4 py-4 transition-shadow hover:shadow-md xl:h-[150px] xl:gap-[15px] xl:py-0 xl:pr-[27px] xl:pl-[15px]"
              >
                <Image
                  src={item.icon}
                  alt=""
                  width={item.w}
                  height={item.h}
                  aria-hidden
                  className="w-[72px] shrink-0 object-contain md:w-[96px] xl:w-[130px]"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-ink text-[18px] leading-[25px] font-semibold tracking-[-0.72px] xl:text-[24px]">
                    {item.title}
                  </h3>
                  <p className="text-muted mt-1 text-[14px] font-medium xl:text-[17px]">{item.blurb}</p>
                </div>
                <Image
                  src="/icons/arrow-sm.svg"
                  alt=""
                  width={20}
                  height={17}
                  aria-hidden
                  className="w-[15px] shrink-0 transition-transform group-hover:translate-x-0.5 xl:w-[20px]"
                />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
