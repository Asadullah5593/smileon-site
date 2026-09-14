import type { Metadata } from "next";
import { getGroupedFaqs } from "@/features/public-site/server/site-content";
import { JsonLd, faqSchema } from "@/shared/seo/json-ld";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers to the questions patients ask us most often.",
  alternates: { canonical: "/faqs" },
};

export default async function FaqsPage() {
  const groups = await getGroupedFaqs();
  const all = groups.flatMap((group) => group.items);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {all.length > 0 ? <JsonLd data={faqSchema(all)} /> : null}

      <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
      <p className="text-muted-foreground mt-2">
        If your question isn&rsquo;t here, call the clinic and we&rsquo;ll answer it.
      </p>

      {groups.length === 0 ? (
        <p className="text-muted-foreground mt-8 rounded-lg border border-dashed p-8 text-center text-sm">
          No questions published yet.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.group} className="mt-10">
            {/* One group is the common case; don't shout a heading at people then. */}
            {groups.length > 1 ? (
              <h2 className="text-xl font-semibold tracking-tight capitalize">{group.group}</h2>
            ) : null}

            <dl className="mt-4 divide-y rounded-lg border">
              {group.items.map((faq) => (
                <div key={faq.id} className="p-4">
                  <dt className="font-medium">{faq.question}</dt>
                  <dd
                    className="prose-cms text-muted-foreground mt-1 text-sm"
                    // Sanitised on write in the repository — safe to render.
                    dangerouslySetInnerHTML={{ __html: faq.answerHtml }}
                  />
                </div>
              ))}
            </dl>
          </section>
        ))
      )}
    </div>
  );
}
