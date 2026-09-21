import Image from "next/image";
import Link from "next/link";
import { clinic, patientCare } from "@/content/site";

/**
 * Design geometry (1440px frame), relative to the band top at y=3644:
 *
 *   band     0   1440×170  bg #ddf1fa
 *   photo    x=581  y=3   408×164  r10
 *   visit    x=998  y=10  420×159  r10
 *   promise  x=22   y=14  550×155  rounded on the bottom corners only
 *
 * The three blocks sit at *different* vertical offsets, so this is a layered
 * canvas rather than a flex row — hence the absolute placement at xl. Below
 * xl everything falls back to ordinary stacked flow.
 *
 *   promise: shield 75×78 at (39,30); title 17px at (137,36);
 *            body 13px/18 at (137,68); CTA 21px at (137,120)
 *   visit:   title 16px at (1025,18); icon column x=1036, text x=1068;
 *            row icons at y=44/78/110/142; Call Clinic 150×40 at (1253,124)
 */

const ROW = "font-semibold text-muted leading-[1.3]";
const ROW_POS = "flex gap-2.5 xl:absolute xl:left-[38px] xl:gap-[15px]";

export function PatientCare() {
  return (
    <section id="contact" className="bg-band scroll-mt-40">
      <div className="mx-auto grid w-full max-w-[1440px] gap-5 px-5 py-7 md:grid-cols-2 md:items-start md:px-8 lg:grid-cols-[550fr_408fr_420fr] lg:items-center lg:gap-[9px] xl:relative xl:block xl:h-[170px] xl:gap-0 xl:px-0 xl:py-0">
        {/* Promise */}
        <div className="rounded-[5px] bg-white p-4 md:order-2 lg:order-none xl:absolute xl:top-[14px] xl:left-[22px] xl:h-[155px] xl:w-[550px] xl:rounded-t-none xl:rounded-b-[5px] xl:p-0">
          <div className="flex gap-3 xl:gap-[23px] xl:pt-[16px] xl:pl-[17px]">
            <Image
              src="/icons/shield-badge.svg"
              alt=""
              width={75}
              height={78}
              aria-hidden
              className="h-[56px] w-auto shrink-0 xl:h-[78px]"
            />
            <div className="xl:pt-[6px]">
              <h3 className="text-ink text-[18px] leading-[22px] font-bold tracking-[-1px] xl:text-[25px] xl:leading-[30px]">
                {patientCare.title}
              </h3>
              <p className="text-muted mt-2 text-[12px] leading-[18px] font-semibold xl:mt-[2px] xl:max-w-[430px] xl:text-[13.5px]">
                {patientCare.body}
              </p>
              <Link
                href="#contact"
                className="text-ink mt-3 inline-flex items-center gap-2 text-[16px] leading-[21px] font-semibold tracking-[-1px] transition-opacity hover:opacity-70 xl:mt-[16px] xl:gap-[11px] xl:text-[21px]"
              >
                {patientCare.cta}
                <Image src="/icons/arrow-sm.svg" alt="" width={19} height={16} aria-hidden className="w-[19px]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Clinic photo */}
        <div className="relative mx-auto aspect-[408/164] w-full max-w-[560px] overflow-hidden rounded-[10px] md:order-1 md:col-span-2 lg:order-none lg:col-span-1 lg:max-w-none xl:absolute xl:top-[3px] xl:left-[581px] xl:aspect-auto xl:h-[164px] xl:w-[408px] xl:max-w-none">
          <Image
            src={patientCare.image.src}
            alt={patientCare.image.alt}
            fill
            sizes="(max-width: 1400px) 100vw, 408px"
            className="object-cover"
          />
        </div>

        {/* Visit */}
        <div className="rounded-[10px] bg-white p-4 md:order-3 lg:order-none xl:absolute xl:top-[10px] xl:left-[998px] xl:mt-0 xl:h-[159px] xl:w-[420px] xl:p-0">
          <h3 className="text-ink text-[14px] leading-[21px] font-semibold xl:pt-[8px] xl:pl-[27px] xl:text-[16px]">
            {patientCare.visitTitle}
          </h3>

          <ul className="mt-2 space-y-2 lg:space-y-1.5 xl:mt-0 xl:space-y-0">
            <li className={`${ROW_POS} xl:top-[34px]`}>
              <Image src="/icons/pin-alt.svg" alt="" width={16} height={18} aria-hidden className="w-[16px] shrink-0 self-start" />
              <span className={`${ROW} text-[11px] xl:w-[332px] xl:text-[11.5px]`}>{clinic.fullAddress}</span>
            </li>
            <li className={`${ROW_POS} xl:top-[68px]`}>
              <Image src="/icons/phone-alt.svg" alt="" width={15} height={16} aria-hidden className="w-[15px] shrink-0 self-start" />
              <a href={`tel:${clinic.phone}`} className={`${ROW} hover:text-brand text-[12px] xl:text-[14px]`}>
                {clinic.phone}
              </a>
            </li>
            <li className={`${ROW_POS} xl:top-[100px]`}>
              <Image src="/icons/clock-alt.svg" alt="" width={18} height={17} aria-hidden className="w-[18px] shrink-0 self-start" />
              <span className={`${ROW} text-[11px] xl:text-[12px]`}>
                {clinic.hoursLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
            <li className={`${ROW_POS} xl:top-[132px]`}>
              <Image src="/icons/pin-alt.svg" alt="" width={16} height={18} aria-hidden className="w-[16px] shrink-0 self-start" />
              <Link
                href={clinic.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link inline-flex items-center gap-[7px] text-[12px] leading-[14px] font-semibold tracking-[-1px] hover:underline xl:text-[14px]"
              >
                {patientCare.directionsCta}
                <Image src="/icons/arrow-tiny.svg" alt="" width={12} height={10} aria-hidden className="w-[12px]" />
              </Link>
            </li>
          </ul>

          <a
            href={`tel:${clinic.phone}`}
            className="bg-brand mt-3 inline-flex h-[36px] items-center justify-center gap-2 rounded-[5px] px-4 lg:-mt-[34px] lg:ml-auto lg:flex lg:w-[150px] lg:px-0 text-[14px] font-semibold tracking-[-1px] text-white transition-opacity hover:opacity-90 xl:absolute xl:top-[114px] xl:left-[255px] xl:mt-0 xl:h-[40px] xl:w-[150px] xl:gap-[7px] xl:px-0 xl:text-[16px]"
          >
            <Image src="/icons/phone-call.svg" alt="" width={17} height={19} aria-hidden className="w-[15px]" />
            {patientCare.callCta}
          </a>
        </div>
      </div>
    </section>
  );
}
