import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { listTaxonomy } from "@/features/taxonomy/server/taxonomy-repository";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { PostForm } from "@/features/posts/components/PostForm";

export const metadata: Metadata = { title: "New post" };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requirePermission("posts.create");

  const [categories, tags] = await Promise.all([
    listTaxonomy({ kind: "category" }),
    listTaxonomy({ kind: "tag" }),
  ]);

  return (
    <>
      <PageHeader title="New post" description="It stays a draft until you publish it." />
      <PostForm categories={categories} tags={tags} />
    </>
  );
}
