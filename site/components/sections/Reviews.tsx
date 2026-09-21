import Image from "next/image";
import Link from "next/link";
import { reviews } from "@/content/site";

/**
 * Design geometry (1440px frame):
 *   heading  x=48 y=3120  37px Bold -1px, subtitle on the SAME line (25px)
 *   cards          y=3177 430×185, radius 10, 1px rgba(152,195,240,.5)
 *                  quote 16px SemiBold #555894 / author 16px Bold #0c3faf
 */
export function Reviews() {
  return (
    <section className="pt-10 xl:pt-[58px]">
      <div className="shell">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-3 xl:gap-y-0">
            <h2 className="h-section">{reviews.title}</h2>
            <p className="text-muted text-[15px] leading-[1.4] font-medium md:text-[19px] xl:text-[25px] xl:leading-none">{reviews.subtitle}</p>
          </div>
          <Link href="#" className="link-more">
            {reviews.cta}
            <Image src="/icons/arrow-sm.svg" alt="" width={20} height={17} aria-hidden className="w-[15px] xl:w-[20px]" />
          </Link>
        </div>

        <div className="mt-6 grid gap-[27px] md:grid-cols-3 xl:mt-[20px]">
          {reviews.items.map((review) => (
            <figure
              key={review.author}
              className="rounded-[10px] border border-[rgba(152,195,240,0.5)] bg-white px-[25px] py-5 xl:h-[185px]"
            >
              <div className="flex items-center gap-2.5">
                <Image src="/icons/google-g.svg" alt="Google" width={30} height={31} className="size-[22px] xl:size-[26px]" />
                <Image
                  src="/icons/google-stars.svg"
                  alt="Rated 5 out of 5"
                  width={114}
                  height={17}
                  className="h-[14px] w-auto xl:h-[17px]"
                />
              </div>
              <blockquote className="text-muted mt-3 text-[13px] leading-[1.5] font-semibold xl:text-[16px]">
                “{review.quote}”
              </blockquote>
              <figcaption className="text-author mt-3 text-[13px] leading-[1.5] font-bold xl:text-[16px]">
                {review.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
