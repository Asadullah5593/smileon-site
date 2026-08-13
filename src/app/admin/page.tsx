import Link from "next/link";
import { CalendarCheck, Image as ImageIcon, Stethoscope, type LucideIcon } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { getViewer } from "@/shared/auth/permissions";
import { viewerCanAny } from "@/shared/auth/permission-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";
import { PageHeader } from "@/features/admin/components/PageHeader";

export const dynamic = "force-dynamic";

type Tile = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string;
  load: () => Promise<{ value: number; hint: string }>;
};

/**
 * One entry per module that actually has a page to link to. Adding a tile as a
 * module lands is a single entry here — and a viewer only ever triggers the
 * queries for tiles they are allowed to see.
 */
const TILES: Tile[] = [
  {
    label: "Treatments",
    href: "/admin/services",
    icon: Stethoscope,
    permission: "services.read",
    load: async () => {
      const [total, published] = await Promise.all([
        prisma.service.count(),
        prisma.service.count({ where: { status: "PUBLISHED" } }),
      ]);
      return { value: total, hint: `${published} published` };
    },
  },
  {
    label: "New requests",
    href: "/admin/appointments",
    icon: CalendarCheck,
    permission: "appointments.read",
    load: async () => ({
      value: await prisma.appointment.count({ where: { status: "NEW" } }),
      hint: "awaiting response",
    }),
  },
  {
    label: "Media files",
    href: "/admin/media",
    icon: ImageIcon,
    permission: "media.read",
    load: async () => ({
      value: await prisma.media.count(),
      hint: "in the library",
    }),
  },
];

export default async function AdminDashboardPage() {
  const viewer = await getViewer();

  const visible = TILES.filter((tile) => viewerCanAny(viewer, tile.permission));
  const stats = await Promise.all(
    visible.map(async (tile) => ({ ...tile, ...(await tile.load()) })),
  );

  const canSeeAppointments = viewerCanAny(viewer, "appointments.read");
  const recent = canSeeAppointments
    ? await prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, phone: true, status: true },
      })
    : [];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${viewer?.name.split(" ")[0] ?? "there"}`}
        description="Everything on smileon.pk is managed from here."
      />

      {stats.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover:border-primary/40 transition-colors">
              <Link href={stat.href}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-muted-foreground text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="text-muted-foreground size-4" aria-hidden />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{stat.value}</p>
                  <p className="text-muted-foreground text-xs">{stat.hint}</p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : null}

      {canSeeAppointments ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Latest appointment requests</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No requests yet.</p>
            ) : (
              <ul className="divide-y">
                {recent.map((appointment) => (
                  <li key={appointment.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{appointment.name}</p>
                      <p className="text-muted-foreground text-xs">{appointment.phone}</p>
                    </div>
                    <Badge variant={appointment.status === "NEW" ? "default" : "secondary"}>
                      {appointment.status.toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/appointments"
              className="text-primary mt-4 inline-block text-sm underline underline-offset-4"
            >
              View all requests
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
