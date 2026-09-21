import Image from "next/image";
import Link from "next/link";
import { dentists } from "@/content/site";

/**
 * Design geometry (1440px frame):
 *   heading  x=48 y=1740  37px Bold -1px
 *   subtitle       y=1777 25px Medium #555894
 *   cards          312×350, radius 10, 1px rgba(0,0,0,.1), 32px gutter
 *                  image 312×230 flush to the top corners
 *                  name 20px Bold / role 15px Medium #555894
 */
export function Dentists() {
  return (
    <section id="dentists" className="scroll-mt-40 pt-10 xl:pt-[58px]">
      <div className="shell">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div>
            <h2 className="h-section">Meet Our Dentists</h2>
            <p className="sub-section">Experienced specialists providing personalised care for you and your family.</p>
          </div>
          <Link href="#dentists" className="link-more">
            Meet all dentists
            <Image src="/icons/arrow-sm.svg" alt="" width={20} height={17} aria-hidden className="w-[15px] xl:w-[20px]" />
          </Link>
        </div>

        <div className="mt-6 grid gap-[32px] sm:grid-cols-2 lg:grid-cols-4 xl:mt-[35px]">
          {dentists.map((person) => (
            <article
              key={person.name}
              className="group overflow-hidden rounded-[10px] border border-black/10 bg-white transition-shadow hover:shadow-md xl:h-[350px]"
            >
              {/* 312×230 visible slot; sources are pre-cropped to this ratio. */}
              <div className="relative aspect-[312/230] overflow-hidden">
                <Image
                  src={person.image}
                  alt={`Portrait of ${person.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 312px"
                  className="object-cover"
                />
              </div>
              <div className="px-[15px] pt-[15px] pb-[10px]">
                <h3 className="text-ink text-[16px] leading-[25px] font-bold xl:text-[20px]">{person.name}</h3>
                <p className="text-muted mt-0.5 text-[13px] leading-[1.35] font-medium xl:mt-[3px] xl:text-[15px]">
                  {person.role}
                  <br />
                  {person.focus}
                </p>
                <Link
                  href="#dentists"
                  className="text-ink mt-2.5 inline-flex items-center gap-2 text-[13px] font-bold tracking-[-1px] transition-opacity hover:opacity-70 xl:mt-[9px] xl:text-[15px]"
                >
                  View {person.name}’s profile
                  <Image
                    src="/icons/arrow-sm.svg"
                    alt=""
                    width={20}
                    height={17}
                    aria-hidden
                    className="w-[12px] transition-transform group-hover:translate-x-0.5 xl:w-[14px]"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
