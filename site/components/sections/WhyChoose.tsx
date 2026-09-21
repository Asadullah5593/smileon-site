import Image from "next/image";
import Link from "next/link";
import { overseas, whyChoose } from "@/content/site";

/**
 * Design geometry (1440px frame):
 *   heading  x=48 y=2744  37px Bold -1px
 *   cards          y=2801 320×101, 1px #d2e5f8, 21px gutter
 *                  title 17px Bold #0b057d / body 14px SemiBold #555894
 *   band     0    y=2912 1440×150 bg #ddf1fa (full bleed)
 *                  globe 90×90 at x=49, title 25px Bold, points 14px SemiBold
 *                  photo 450×150 at x=586, link 20px SemiBold at x=1070
 */
export function WhyChoose() {
  return (
    <>
      <section id="why" className="scroll-mt-40 pt-10 pb-8 xl:pt-[58px] xl:pb-[10px]">
        <div className="shell">
          <h2 className="h-section">Why Choose SmileOn?</h2>

          <div className="mt-5 grid gap-[21px] sm:grid-cols-2 lg:grid-cols-4 xl:mt-[20px]">
            {whyChoose.map((item) => (
              <div
                key={item.title}
                className="border-hairline flex items-start gap-[9px] rounded-[6px] border px-[13px] py-3.5 xl:h-[101px] xl:items-center"
              >
                <Image
                  src={item.icon}
                  alt=""
                  width={item.w}
                  height={item.h}
                  aria-hidden
                  className="h-[34px] w-auto shrink-0 xl:h-auto xl:w-[55px]"
                />
                <div className="min-w-0">
                  <h3 className="text-ink text-[14px] font-bold tracking-[-1px] xl:text-[17px] min-[1440px]:whitespace-nowrap">{item.title}</h3>
                  <p className="text-muted mt-1 text-[12px] leading-[1.3] font-semibold xl:text-[14px]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overseas band — full bleed #ddf1fa */}
      <section id="overseas" className="bg-band scroll-mt-40">
        <div className="shell flex flex-col gap-5 py-7 lg:h-[150px] lg:flex-row lg:items-center lg:gap-[30px] lg:py-0">
          <Image
            src="/icons/globe.svg"
            alt=""
            width={90}
            height={90}
            aria-hidden
            className="hidden h-[64px] w-auto shrink-0 md:block xl:h-[90px]"
          />

          <div className="shrink-0">
            <h3 className="text-ink text-[18px] font-bold tracking-[-1px] xl:text-[25px]">{overseas.title}</h3>
            <ul className="mt-1.5 space-y-1">
              {overseas.points.map((point) => (
                <li key={point} className="text-muted flex items-start gap-2 text-[12px] leading-[1.3] font-semibold xl:text-[14px]">
                  <Image src="/icons/check.svg" alt="" width={20} height={15} aria-hidden className="mt-1 w-[13px] shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Illustration sits between the copy and the link in the design. */}
          <Image
            src={overseas.image.src}
            alt={overseas.image.alt}
            width={900}
            height={300}
            className="mx-auto hidden h-[100px] w-auto object-contain lg:block min-[1200px]:h-[130px] xl:h-[150px]"
          />

          <Link
            href="#contact"
            className="text-ink ml-auto inline-flex shrink-0 items-center gap-2 text-[14px] font-semibold tracking-[-1px] transition-opacity hover:opacity-70 xl:text-[20px]"
          >
            {overseas.cta}
            <Image src="/icons/arrow-sm.svg" alt="" width={20} height={17} aria-hidden className="w-[15px] xl:w-[20px]" />
          </Link>
        </div>
      </section>
    </>
  );
}
