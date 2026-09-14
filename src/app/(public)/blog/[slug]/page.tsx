import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPostBySlug, getPublishedPosts } from "@/features/public-site/server/site-content";
import { htmlToText } from "@/shared/editor/sanitize";
import { siteUrl } from "@/shared/config/env";
import { JsonLd, articleSchema, breadcrumbSchema } from "@/shared/seo/json-ld";
import { Badge } from "@/shared/ui/primitives/badge";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const description = post.seoDescription ?? post.excerpt ?? htmlToText(post.bodyHtml ?? "", 160);

  return {
    title: post.seoTitle ?? post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description,
      url: `/blog/${post.slug}`,
      ...(post.coverUrl ? { images: [post.coverUrl] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = `${siteUrl}/blog/${post.slug}`;
  const related = (await getPublishedPosts({ limit: 4 }))
    .filter((item) => item.id !== post.id)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={articleSchema({
          headline: post.title,
          url,
          description: post.excerpt,
          image: post.coverUrl,
          authorName: post.authorName,
          publishedAt: post.publishedAt,
          modifiedAt: post.updatedAt,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Blog", url: `${siteUrl}/blog` },
          { name: post.title, url },
        ])}
      />

      <nav className="text-muted-foreground mb-4 text-sm">
        <Link href="/blog" className="hover:text-foreground">
          Blog
        </Link>{" "}
        / <span>{post.title}</span>
      </nav>

      {post.categoryNames.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {post.categoryNames.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      ) : null}

      <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>

      <p className="text-muted-foreground mt-3 text-sm">
        {post.authorName ? `By ${post.authorName} · ` : ""}
        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
        {post.readMinutes ? ` · ${post.readMinutes} min read` : ""}
      </p>

      {post.coverUrl ? (
        <div className="bg-muted relative mt-8 aspect-[16/9] overflow-hidden rounded-xl">
          <Image
            src={post.coverUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            className="object-cover"
          />
        </div>
      ) : null}

      {post.bodyHtml ? (
        <div
          className="prose-cms mt-8"
          // Sanitised on write in the repository — safe to render.
          dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
        />
      ) : null}

      {post.tagNames.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-1.5">
          {post.tagNames.map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
        </div>
      ) : null}

      {related.length > 0 ? (
        <aside className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold tracking-tight">More from the blog</h2>
          <ul className="mt-4 space-y-2">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/blog/${item.slug}`}
                  className="text-primary text-sm underline underline-offset-4"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </article>
  );
}
