"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { results } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Design geometry (1440px frame):
 *   heading  x=48 y=2245  37px Bold -1px, subtitle y=2281
 *   tabs           y=2318 300×53 (last 399×53), radius 10, 15px apart
 *                  active bg #0399b2 / idle bg #f3f9fe + rgba(58,136,255,.3)
 *   photo    x=48  y=2386 880×300, radius 15
 *   badges         y=2633 145×53 #0399b2, rounded on the inner side only
 *   case     x=966 y=2386 426×300, bg #f3f9fe, radius 10, 1px black/10
 */
export function Results() {
  const [tab, setTab] = useState(0);

  return (
    <section id="results" className="scroll-mt-40 pt-10 xl:pt-[58px]">
      <div className="shell">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div>
            <h2 className="h-section">{results.title}</h2>
            <p className="sub-section">{results.subtitle}</p>
          </div>
          <Link href="#results" className="link-more">
            View Smile Gallery
            <Image src="/icons/arrow-sm.svg" alt="" width={20} height={17} aria-hidden className="w-[15px] xl:w-[20px]" />
          </Link>
        </div>

        <div role="tablist" aria-label="Result categories" className="mt-5 flex flex-wrap gap-[15px] xl:mt-[12px]">
          {results.tabs.map((label, i) => (
            <button
              key={label}
              role="tab"
              type="button"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className={cn(
                "focus-visible:outline-brand h-[42px] rounded-[10px] px-5 text-[13px] font-bold tracking-[-1px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:h-[46px] md:text-[15px] lg:h-[50px] lg:px-8 lg:text-[17px] min-[1200px]:h-[53px] min-[1200px]:text-[19px] xl:h-[53px] xl:w-[300px] xl:px-0 xl:text-[20px]",
                tab === i ? "bg-brand text-white" : "bg-panel text-muted border border-[rgba(58,136,255,0.3)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-[38px] lg:grid-cols-[880fr_426fr] xl:mt-[15px]">
          {/* Before / after */}
          <div className="relative overflow-hidden rounded-[15px]">
            <div className="relative aspect-[880/300]">
              <Image
                src={results.image.src}
                alt={results.image.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 880px"
                className="object-cover"
              />
            </div>
            <span className="bg-brand absolute bottom-0 left-0 flex h-[36px] items-center rounded-tr-[10px] px-4 text-[14px] font-semibold tracking-[-1px] text-white xl:h-[53px] xl:w-[145px] xl:justify-center xl:rounded-tr-[10px] xl:rounded-br-[10px] xl:px-0 xl:text-[27px]">
              BEFORE
            </span>
            <span className="bg-brand absolute right-0 bottom-0 flex h-[36px] items-center rounded-tl-[10px] px-4 text-[14px] font-semibold tracking-[-1px] text-white xl:h-[53px] xl:w-[145px] xl:justify-center xl:rounded-tl-[10px] xl:rounded-bl-[10px] xl:px-0 xl:text-[27px]">
              AFTER
            </span>

          </div>

          {/* Featured case */}
          <div className="bg-panel rounded-[10px] border border-black/10 px-[25px] py-[22px] xl:h-[300px]">
            <h3 className="text-ink text-[20px] leading-[25px] font-bold xl:text-[25px]">{results.featured.heading}</h3>
            <dl className="mt-4 space-y-3 xl:mt-[22px] xl:space-y-[18px]">
              {results.featured.rows.map((row) => (
                <div key={row.label} className="flex flex-wrap gap-x-2">
                  <dt className="text-ink text-[14px] font-bold xl:text-[17px]">{row.label}</dt>
                  <dd className="text-muted text-[14px] leading-[1.3] font-medium xl:text-[17px]">{row.value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="#results"
              className="text-ink mt-5 inline-flex items-center gap-2 text-[16px] font-semibold tracking-[-1px] transition-opacity hover:opacity-70 xl:mt-[26px] xl:text-[22px]"
            >
              {results.featured.cta}
              <Image src="/icons/arrow-sm.svg" alt="" width={20} height={17} aria-hidden className="w-[15px] xl:w-[18px]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
