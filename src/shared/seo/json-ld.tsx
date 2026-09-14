/**
 * Structured data helpers. Google reads these to build rich results — for a
 * clinic the `Dentist` (LocalBusiness) and `FAQPage` types matter most.
 */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Values come from our own database, and JSON.stringify escapes them.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function dentistSchema(input: {
  url: string;
  name?: string;
  telephone?: string | null;
  address?: string | null;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: input.name ?? "SmileOn Dental Clinic",
    url: input.url,
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.address
      ? { address: { "@type": "PostalAddress", streetAddress: input.address } }
      : {}),
  };
}

export function faqSchema(items: { question: string; answerHtml: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answerHtml.replace(/<[^>]+>/g, " ").trim() },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleSchema(input: {
  headline: string;
  url: string;
  description?: string | null;
  image?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
  modifiedAt?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.authorName ? { author: { "@type": "Person", name: input.authorName } } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.modifiedAt ? { dateModified: input.modifiedAt } : {}),
  };
}

export function personSchema(input: {
  name: string;
  url: string;
  jobTitle?: string | null;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: input.name,
    url: input.url,
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.image ? { image: input.image } : {}),
  };
}

/**
 * Opening hours in the shape Google expects. `hours` is the JSON column from
 * `Location`; closed days are simply omitted.
 */
export function openingHoursSchema(
  hours: Record<string, { closed: boolean; open?: string | null; close?: string | null }>,
) {
  const DAY_NAMES: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  return Object.entries(hours).flatMap(([day, entry]) =>
    entry.closed || !entry.open || !entry.close || !DAY_NAMES[day]
      ? []
      : [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${DAY_NAMES[day]}`,
            opens: entry.open,
            closes: entry.close,
          },
        ],
  );
}

export function serviceSchema(input: {
  name: string;
  description?: string | null;
  url: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
  };
}
