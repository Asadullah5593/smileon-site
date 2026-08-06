import Link from "next/link";
import { CalendarCheck, FileText, Image as ImageIcon, Stethoscope } from "lucide-react";
import { prisma } from "@/shared/db/prisma";
import { getViewer } from "@/shared/auth/permissions";
import { viewerCanAny } from "@/shared/auth/permission-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";
import { PageHeader } from "@/features/admin/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const viewer = await getViewer();

  const [services, published, appointments, media, recent] = await Promise.all([
    prisma.service.count(),
    prisma.service.count({ where: { status: "PUBLISHED" } }),
    prisma.appointment.count({ where: { status: "NEW" } }),
    prisma.media.count(),
    prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, phone: true, status: true, createdAt: true },
    }),
  ]);

  const stats = [
    { label: "Treatments", value: services, hint: `${published} published`, icon: Stethoscope },
    { label: "New requests", value: appointments, hint: "awaiting response", icon: CalendarCheck },
    { label: "Media files", value: media, hint: "in the library", icon: ImageIcon },
    { label: "Pages", value: 0, hint: "coming next", icon: FileText },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${viewer?.name.split(" ")[0] ?? "there"}`}
        description="Everything on smileon.pk is managed from here."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
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
          </Card>
        ))}
      </div>

      {viewerCanAny(viewer, "appointments.read") ? (
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
