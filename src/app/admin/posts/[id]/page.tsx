import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { requirePermission } from "@/shared/auth/permissions";
import { getPostById } from "@/features/posts/server/post-repository";
import { listTaxonomy } from "@/features/taxonomy/server/taxonomy-repository";
import { NotFoundError } from "@/shared/api/errors";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { PostForm } from "@/features/posts/components/PostForm";
import { Button } from "@/shared/ui/primitives/button";

export const metadata: Metadata = { title: "Edit post" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  await requirePermission("posts.update");
  const { id } = await params;

  const post = await getPostById(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const [categories, tags] = await Promise.all([
    listTaxonomy({ kind: "category" }),
    listTaxonomy({ kind: "tag" }),
  ]);

  return (
    <>
      <PageHeader
        title={post.title}
        description={`Last updated ${new Date(post.updatedAt).toLocaleString()}`}
        actions={
          post.status === "PUBLISHED" ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/blog/${post.slug}`} target="_blank">
                View live <ExternalLink className="ml-1 size-3.5" />
              </Link>
            </Button>
          ) : null
        }
      />
      <PostForm post={post} categories={categories} tags={tags} />
    </>
  );
}
