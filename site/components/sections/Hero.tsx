import Image from "next/image";
import Link from "next/link";
import { hero, stats } from "@/content/site";

/**
 * Design geometry (1440px frame):
 *   band    162 → 642, left half #ebf8fe, right half a 720×480 photo
 *   eyebrow x=48 y=208   20px Bold  #002689  -0.7px
 *   h1      x=48 y=238   75px Bold  #0b057d, "in Lahore" #0399b2, leading 1
 *   body    x=48 y=426   36px Medium #03328f -1px
 *   buttons y=521, 310×70, radius 12, 29px apart
 *   stats   642 → 752, bg #f3fafe, 20px Bold #03328f, 3 dividers
 */
export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div className="bg-hero-bg">
        <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
          {/* Copy — sits on the design's 48px inset, not a centred column. */}
          <div className="order-2 flex items-center px-5 py-10 md:px-8 lg:order-1 lg:min-h-[480px] lg:py-0 xl:pr-0 xl:pl-12">
            <div className="w-full">
              <p className="text-ink-eyebrow text-[13px] font-bold tracking-[-0.7px] md:text-[16px] xl:text-[20px]">
                {hero.eyebrow}
              </p>

              <h1
                id="hero-title"
                className="text-ink mt-2 text-[40px] leading-none font-bold tracking-[-1px] md:text-[56px] xl:mt-3 xl:text-[75px]"
              >
                Specialist Dental
                <br />
                Care <span className="text-brand">in Lahore</span>
              </h1>

              <p className="text-ink-body mt-4 text-[20px] leading-[1.15] font-medium tracking-[-1px] md:text-[28px] xl:mt-[38px] xl:text-[36px] xl:leading-[39px]">
                {hero.bodyLines.map((line) => (
                  <span key={line} className="block xl:whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </p>

              <div className="mt-6 flex flex-nowrap gap-2 sm:gap-3 xl:mt-[25px] xl:gap-[29px]">
                <Link
                  href={hero.primaryCta.href}
                  className="bg-brand inline-flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-[12px] px-3 text-[12px] sm:h-[54px] sm:flex-none sm:gap-3 sm:px-6 sm:text-[16px] font-medium text-white transition-opacity hover:opacity-90 md:h-[62px] md:text-[19px] xl:h-[70px] xl:w-[310px] xl:px-0 xl:text-[22px] xl:tracking-[-1px]"
                >
                  {hero.primaryCta.label}
                  <Image
                    src="/icons/arrow-right.svg"
                    alt=""
                    width={20}
                    height={17}
                    aria-hidden
                    className="w-[17px] xl:w-[21px]"
                  />
                </Link>

                {/* White button, 2px green border, green label — per the design. */}
                <Link
                  href={hero.secondaryCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-whatsapp text-whatsapp inline-flex h-[46px] flex-1 items-center justify-center gap-1.5 rounded-[12px] border-2 bg-[#fafcff] px-3 text-[12px] sm:h-[54px] sm:flex-none sm:gap-3 sm:px-6 sm:text-[16px] font-semibold transition-colors hover:bg-white md:h-[62px] md:text-[19px] xl:h-[70px] xl:w-[310px] xl:px-0 xl:text-[25px] xl:tracking-[-1px]"
                >
                  <Image
                    src="/icons/whatsapp.svg"
                    alt=""
                    width={31}
                    height={31}
                    aria-hidden
                    className="w-[16px] sm:w-[22px] xl:w-[31px]"
                  />
                  {hero.secondaryCta.label}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative order-1 aspect-[720/480] lg:order-2">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 720px"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Stats band — full bleed #f3fafe, 110px tall at 1440. */}
      <div className="bg-stats-bg">
        <div className="shell grid grid-cols-2 gap-y-6 py-6 lg:grid-cols-4 lg:gap-0 lg:py-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={
                "flex items-center gap-3 lg:h-[110px] lg:justify-center lg:gap-[26px] lg:px-4" +
                (i > 0 ? " lg:border-l lg:border-[#bad1e7]" : "")
              }
            >
              <Image
                src={stat.icon}
                alt=""
                width={stat.w}
                height={stat.h}
                aria-hidden
                className="h-[38px] w-auto shrink-0 xl:h-[56px]"
              />
              <div className="min-w-0">
                <p className="text-ink-body text-[14px] leading-[1.5] font-bold tracking-[-1px] xl:text-[20px]">
                  {stat.value}
                </p>
                <p className="text-ink-body text-[14px] leading-[1.5] font-bold tracking-[-1px] xl:text-[20px]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
