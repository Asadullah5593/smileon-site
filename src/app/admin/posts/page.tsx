import type { Metadata } from "next";
import { requirePermission } from "@/shared/auth/permissions";
import { PageHeader } from "@/features/admin/components/PageHeader";
import { PostsTable } from "@/features/posts/components/PostsTable";

export const metadata: Metadata = { title: "Blog posts" };

export default async function AdminPostsPage() {
  await requirePermission("posts.read");

  return (
    <>
      <PageHeader title="Blog posts" description="Articles published under /blog." />
      <PostsTable />
    </>
  );
}
