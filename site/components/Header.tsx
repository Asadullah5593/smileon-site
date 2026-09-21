"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { clinic, nav } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Design geometry (1440px frame):
 *   topbar   0 → 60    bg #0399b2, 16px Medium white
 *   header   60 → 162  bg white, logo 220×98 at x=48, nav 20px SemiBold #002689
 *   CTA      270×60 at x=1122, bg #039bb0, radius 12px
 * Mobile is an addition — Figma has no small frame.
 */
export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50">
      {/* Topbar — full bleed teal */}
      <div className="bg-brand text-white">
        <div className="shell flex h-[44px] items-center justify-between gap-3 text-[11px] font-medium md:h-[52px] md:gap-4 md:text-[14px] xl:h-[60px] xl:text-[16px]">
          <span className="hidden items-center gap-2.5 md:inline-flex">
            <Image src="/icons/pin.svg" alt="" width={20} height={24} aria-hidden className="w-[13px] xl:w-[15px]" />
            {clinic.address}
          </span>
          <span className="inline-flex items-center gap-2 md:hidden md:gap-2.5 lg:inline-flex">
            <Image src="/icons/clock.svg" alt="" width={23} height={22} aria-hidden className="w-[14px] xl:w-[17px]" />
            <span className="whitespace-nowrap lg:hidden">{clinic.hoursShort}</span>
            <span className="hidden lg:inline">{clinic.hours}</span>
          </span>
          <a href={`tel:${clinic.phone}`} className="ml-auto inline-flex items-center gap-2 hover:underline md:gap-2.5 lg:ml-0">
            <Image src="/icons/phone.svg" alt="" width={19} height={21} aria-hidden className="w-[13px] xl:w-[15px]" />
            {clinic.phone}
          </a>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-white">
        <div className="shell flex h-[76px] items-center justify-between gap-6 md:h-[88px] xl:h-[102px]">
          <Link href="/" className="shrink-0">
            <Image
              src="/img/logo-smileon.webp"
              alt={`${clinic.legalName} home`}
              width={220}
              height={98}
              priority
              className="h-[52px] w-auto md:h-[62px] xl:h-[74px]"
            />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-9" aria-label="Primary">
            {nav.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "text-ink-eyebrow hover:text-brand relative inline-flex h-[102px] items-center gap-1.5 text-[15px] font-semibold tracking-[-0.7px] transition-colors xl:text-[20px]",
                  // The design marks Treatments as the current item with a
                  // navy rule sitting on the header's bottom edge.
                  i === 0 && "after:bg-ink-eyebrow after:absolute after:inset-x-0 after:bottom-0 after:h-[3px]",
                )}
              >
                {item.label}
                {item.hasDropdown ? <ChevronDown className="size-4 xl:size-5" aria-hidden /> : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="#contact"
              className="bg-brand-alt hidden items-center justify-center gap-3 rounded-[12px] px-5 text-[15px] font-medium text-white transition-opacity hover:opacity-90 sm:inline-flex sm:h-[48px] xl:h-[60px] xl:w-[270px] xl:px-0 xl:text-[22px] xl:tracking-[-1px]"
            >
              Book a consultation
              <Image
                src="/icons/arrow-right.svg"
                alt=""
                width={20}
                height={17}
                aria-hidden
                className="w-[16px] xl:w-[20px]"
              />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="text-ink-eyebrow hover:bg-tab-bg rounded-md p-2 lg:hidden"
            >
              {open ? <X className="size-7" aria-hidden /> : <Menu className="size-7" aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        className={cn(
          "border-hairline overflow-hidden border-b bg-white transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-[600px]" : "max-h-0",
        )}
      >
        <nav className="shell flex flex-col py-2" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-ink-eyebrow border-hairline border-b py-3.5 text-[16px] font-semibold last:border-0"
            >
              {item.label}
            </Link>
          ))}
          {/* Address and full hours moved here from the topbar, where three
              rows of small type crowded the logo. Navy icon variants: the
              topbar's white ones would vanish on this white panel. */}
          <div className="text-muted mt-1 space-y-2 pt-3 pb-4 text-[13px] leading-[1.5] font-semibold">
            <p className="flex items-start gap-2.5">
              <Image src="/icons/pin-alt.svg" alt="" width={16} height={18} aria-hidden className="mt-[3px] w-[13px] shrink-0" />
              {clinic.address}
            </p>
            <p className="flex items-start gap-2.5">
              <Image src="/icons/clock-alt.svg" alt="" width={18} height={17} aria-hidden className="mt-[3px] w-[13px] shrink-0" />
              <span>
                {clinic.hoursLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
          </div>
          <Link
            href="#contact"
            onClick={() => setOpen(false)}
            className="bg-brand-alt my-4 inline-flex h-[52px] items-center justify-center gap-3 rounded-[12px] text-[16px] font-medium text-white sm:hidden"
          >
            Book a consultation
          </Link>
        </nav>
      </div>
    </header>
  );
}
