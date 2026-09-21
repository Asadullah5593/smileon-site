import Image from "next/image";
import Link from "next/link";
import { clinic, footer } from "@/content/site";

/**
 * Design geometry (1440px frame). The footer insets 39px, not the 48px the
 * rest of the page uses, and its columns sit on fixed x origins:
 *
 *   body       0 y=3813 1440×190  bg #039bb0
 *   bar        0 y=4003 1440×60   bg #0399b2
 *   brand      x=39   mark 82×93 at y=3847, "SmileOn" 40px at x=120 y=3873,
 *                     "Dental Clinic" 26px at y=3914, tagline 16px at x=64
 *   Quick      title x=340 y=3833, links x=359 (indented 19px)
 *   Treatments title x=531, links x=531
 *   Contact    title x=749, icons x=735, values x=757
 *   Hours      title x=970, values x=941 (values sit LEFT of the title)
 *   script     x=1248 y=3864, heart 25×23 at x=1369 y=3878
 *
 * Titles are 20px SemiBold white; every value is 13px SemiBold white/70 on a
 * 24px pitch. Everything is italic, like the rest of the page.
 */

const TITLE = "text-[16px] leading-[1.5] font-semibold text-white xl:text-[20px]";
const ITEM = "text-[12px] leading-[17px] font-semibold text-white/70 xl:text-[13px]";
const LIST = "mt-3 space-y-[6px] xl:mt-[14px]";
const ROW = "leading-[17px]"; // keeps the design's 24px row pitch

export function Footer() {
  return (
    <footer className="bg-brand-alt text-white">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-8 xl:px-[39px]">
        <div className="grid gap-8 py-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_1fr_1fr_1fr_0.8fr] xl:h-[190px] xl:grid-cols-[301px_191px_204px_206px_307px_144px] xl:gap-0 xl:py-0 xl:pt-[20px]">
          {/* Brand */}
          <div className="xl:mt-[14px]">
            <div className="flex items-start">
              {/* This export already ships white on transparency. */}
              <Image
                src="/img/logo-mark.webp"
                alt=""
                width={246}
                height={276}
                aria-hidden
                className="w-[66px] shrink-0 xl:w-[82px]"
              />
              <div className="pt-[20px] xl:pt-[26px]">
                <p className="text-[32px] leading-[33px] font-semibold text-white xl:text-[40px] xl:leading-[41px]">
                  {clinic.name}
                </p>
                <p className="text-[21px] leading-[28px] font-semibold text-white/70 xl:text-[26px] xl:leading-[34px]">
                  Dental Clinic
                </p>
              </div>
            </div>
            <p className="pl-[25px] text-[13px] leading-[21px] font-semibold text-white/70 xl:text-[16px]">
              {footer.blurb}
            </p>
          </div>

          {/* Quick Links — the design indents these 19px past the title. */}
          <div>
            <h2 className={TITLE}>{footer.columns[0].title}</h2>
            <ul className={`${LIST} xl:pl-[19px]`}>
              {footer.columns[0].links.map((link) => (
                <li key={link} className={ROW}>
                  <Link href="#" className={`${ITEM} transition-colors hover:text-white`}>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Treatments */}
          <div>
            <h2 className={TITLE}>{footer.columns[1].title}</h2>
            <ul className={LIST}>
              {footer.columns[1].links.map((link) => (
                <li key={link} className={ROW}>
                  <Link href="#" className={`${ITEM} transition-colors hover:text-white`}>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — title sits 14px right of the icon column. */}
          <div>
            <h2 className={`${TITLE} xl:pl-[14px]`}>Contact us</h2>
            <ul className={LIST}>
              <li className={`flex items-center gap-[9px] ${ROW}`}>
                <Image src="/icons/footer-phone.svg" alt="" width={13} height={14} aria-hidden className="w-[13px] shrink-0" />
                <a href={`tel:${clinic.phone}`} className={`${ITEM} hover:text-white`}>
                  {clinic.phone}
                </a>
              </li>
              <li className={`flex items-center gap-[9px] ${ROW}`}>
                <Image src="/icons/footer-mail.svg" alt="" width={15} height={12} aria-hidden className="w-[15px] shrink-0" />
                <a href={`mailto:${clinic.email}`} className={`${ITEM} hover:text-white`}>
                  {clinic.email}
                </a>
              </li>
              <li className={`flex items-center gap-[9px] ${ROW}`}>
                <Image src="/icons/footer-pin.svg" alt="" width={13} height={15} aria-hidden className="w-[13px] shrink-0" />
                <span className={ITEM}>Johar Town, Lahore</span>
              </li>
            </ul>
          </div>

          {/* Clinic Hours — title sits 29px right of its values. */}
          <div>
            <h2 className={`${TITLE} xl:pl-[29px]`}>Clinic Hours</h2>
            <ul className={LIST}>
              {clinic.hoursLines.map((line) => (
                <li key={line} className={`${ITEM} ${ROW}`}>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          {/* Script flourish — three stepped lines, each tilted, heart at the
              end of the first. Kaushan has no italic face, so it opts out. */}
          <div className="relative hidden lg:block xl:mt-[25px]">
            <div
              className="text-[20px] leading-[25px] text-white"
              style={{ fontFamily: "var(--font-script)", fontStyle: "normal" }}
            >
              <span className="block origin-left -rotate-[18deg]">Healthier</span>
              <span className="block origin-left -rotate-[18deg] pl-[20px]">Smiles</span>
              <span className="block origin-left -rotate-[18deg] pl-[18px]">Happier Lives</span>
            </div>
            <Image
              src="/icons/footer-flourish.svg"
              alt=""
              width={26}
              height={23}
              aria-hidden
              className="absolute top-[16px] right-0 w-[25px] xl:right-auto xl:left-[131px]"
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-brand border-t border-[#03899c]">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-3.5 md:px-8 xl:h-[60px] xl:px-[46px] xl:py-0">
          <p className="flex items-center gap-1 text-[11px] leading-[17px] font-semibold text-white xl:text-[13px]">
            <Image src="/icons/copyright.svg" alt="" width={18} height={18} aria-hidden className="w-[17px] shrink-0" />
            {footer.legal}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 text-[11px] leading-[17px] font-semibold tracking-[0.65px] text-white xl:mr-[21px] xl:text-[13px]">
            {footer.policies.map((policy, i) => (
              <span key={policy} className="flex items-center gap-x-3">
                <Link href="#" className="transition-opacity hover:opacity-80">
                  {policy}
                </Link>
                {i < footer.policies.length - 1 ? <span aria-hidden>|</span> : null}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
