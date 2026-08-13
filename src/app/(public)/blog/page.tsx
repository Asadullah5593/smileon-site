import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getBlogCategories, getPublishedPosts } from "@/features/public-site/server/site-content";
import { Card, CardContent } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";

export const metadata: Metadata = {
  title: "Blog",
  description: "Dental advice, treatment guides and clinic news from the SmileOn team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage({ searchParams }: PageProps<"/blog">) {
  const { category } = await searchParams;
  const categorySlug = typeof category === "string" ? category : undefined;

  const [categories, allPosts] = await Promise.all([getBlogCategories(), getPublishedPosts()]);

  const active = categories.find((item) => item.slug === categorySlug);
  // Filtering in memory: a clinic blog is dozens of posts, and this keeps the
  // whole page on one cached read rather than a query per category.
  const posts = active ? allPosts.filter((post) => post.categoryIds.includes(active.id)) : allPosts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      <p className="text-muted-foreground mt-2">
        Advice and answers from the people who treat you.
      </p>

      {categories.length > 0 ? (
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Categories">
          <Link href="/blog">
            <Badge variant={active ? "outline" : "default"}>All</Badge>
          </Link>
          {categories.map((item) => (
            <Link key={item.id} href={`/blog?category=${item.slug}`}>
              <Badge variant={active?.id === item.id ? "default" : "outline"}>{item.name}</Badge>
            </Link>
          ))}
        </nav>
      ) : null}

      {posts.length === 0 ? (
        <p className="text-muted-foreground mt-8 rounded-lg border border-dashed p-8 text-center text-sm">
          {active ? `Nothing published under ${active.name} yet.` : "No posts published yet."}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden pt-0">
              {post.coverUrl ? (
                <div className="bg-muted relative aspect-[16/9]">
                  <Image
                    src={post.coverUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <CardContent className={post.coverUrl ? "" : "pt-6"}>
                {post.categoryNames.length > 0 ? (
                  <p className="text-primary text-xs font-medium">
                    {post.categoryNames.join(" · ")}
                  </p>
                ) : null}
                <h2 className="mt-1 font-medium">{post.title}</h2>
                {post.excerpt ? (
                  <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">{post.excerpt}</p>
                ) : null}
                <p className="text-muted-foreground mt-2 text-xs">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
                  {post.readMinutes ? ` · ${post.readMinutes} min read` : ""}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-primary mt-3 inline-flex items-center gap-1 text-sm underline underline-offset-4"
                >
                  Read more <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
