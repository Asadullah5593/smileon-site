"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { clinic, hero } from "@/content/site";
import { cn } from "@/lib/cn";

/**
 * Sticky mobile action bar.
 *
 * It appears only once the hero has scrolled away — before that its buttons
 * would duplicate the hero's own — and retreats again over the Patient Care
 * band, where Call Clinic and Get directions already live. Because it hides
 * before the footer, the page needs no extra bottom padding to stay reachable.
 *
 * Button language matches the hero exactly: teal #0399b2 fill, 12px radius,
 * 48px targets (above the 44px minimum).
 */
export function MobileActionBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const heroEl = document.querySelector("[aria-labelledby='hero-title']");
    // The footer is watched as well as #contact: once the contact band scrolls
    // past, nothing else would suppress the bar and it would cover the footer.
    const suppressors = [document.querySelector("#contact"), document.querySelector("footer")].filter(
      (el): el is Element => el !== null,
    );
    if (!heroEl || suppressors.length === 0) return;

    // The bar shows only when none of the watched regions is on screen.
    const onScreen = new Map<Element, boolean>([[heroEl, true]]);
    for (const el of suppressors) onScreen.set(el, false);

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) onScreen.set(entry.target, entry.isIntersecting);
      setShow(![heroEl, ...suppressors].some((el) => onScreen.get(el)));
    });

    for (const el of [heroEl, ...suppressors]) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      inert={!show}
      aria-hidden={!show}
      className={cn(
        "border-hairline fixed inset-x-0 bottom-0 z-40 border-t bg-white shadow-[0_-4px_16px_rgba(11,5,125,0.07)]",
        "transition-transform duration-300 ease-out motion-reduce:transition-none md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
      // Clears the iOS home indicator.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-2.5 px-4 pt-2.5 pb-3.5">
        <Link
          href={hero.primaryCta.href}
          className="bg-brand flex h-[48px] flex-1 items-center justify-center rounded-[12px] text-[15px] font-semibold tracking-[-0.3px] text-white transition-opacity active:opacity-90"
        >
          {hero.primaryCta.label}
        </Link>

        <a
          href={`tel:${clinic.phone}`}
          aria-label={`Call ${clinic.phone}`}
          className="border-ink grid size-[48px] shrink-0 place-items-center rounded-[12px] border-[1.5px] transition-colors active:bg-[#f3f9fe]"
        >
          <Image src="/icons/phone-alt.svg" alt="" width={15} height={16} aria-hidden className="w-[19px]" />
        </a>

        <a
          href={clinic.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="bg-whatsapp grid size-[48px] shrink-0 place-items-center rounded-[12px] transition-opacity active:opacity-90"
        >
          {/* The export is green on transparency, which would vanish on the
              green fill — forced to white. */}
          <Image
            src="/icons/whatsapp.svg"
            alt=""
            width={31}
            height={31}
            aria-hidden
            className="w-[23px] brightness-0 invert"
          />
        </a>
      </div>
    </div>
  );
}
