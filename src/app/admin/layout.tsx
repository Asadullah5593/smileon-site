import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getViewer } from "@/shared/auth/permissions";
import { PermissionsProvider } from "@/shared/auth/permissions-context";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { AdminHeader } from "@/features/admin/components/AdminHeader";

export const metadata: Metadata = {
  title: { default: "SmileOn CMS", template: "%s · SmileOn CMS" },
  robots: { index: false, follow: false },
};

/**
 * The real gate. `src/proxy.ts` only does an optimistic cookie check; this
 * layout resolves the actual user (and their permissions) on every request, so
 * a deactivated account is locked out immediately.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");

  return (
    <PermissionsProvider viewer={viewer}>
      <div className="flex min-h-svh">
        <aside className="bg-sidebar hidden w-64 shrink-0 border-r lg:block">
          <div className="sticky top-0 h-svh">
            <AdminSidebar />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
