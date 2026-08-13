import Image from "next/image";
import type { Metadata } from "next";
import { User } from "lucide-react";
import { getFullTeam } from "@/features/public-site/server/site-content";
import { siteUrl } from "@/shared/config/env";
import { JsonLd, personSchema } from "@/shared/seo/json-ld";
import { Card, CardContent } from "@/shared/ui/primitives/card";
import { Badge } from "@/shared/ui/primitives/badge";

export const metadata: Metadata = {
  title: "Our team",
  description: "Meet the dentists and specialists who treat you at SmileOn.",
  alternates: { canonical: "/team" },
};

export default async function TeamPage() {
  const team = await getFullTeam();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {team.map((member) => (
        <JsonLd
          key={member.id}
          data={personSchema({
            name: member.name,
            url: `${siteUrl}/team`,
            jobTitle: member.designation,
            image: member.photoUrl,
          })}
        />
      ))}

      <h1 className="text-3xl font-semibold tracking-tight">Our team</h1>
      <p className="text-muted-foreground mt-2">
        The people who will look after you, and what they specialise in.
      </p>

      {team.length === 0 ? (
        <p className="text-muted-foreground mt-8 rounded-lg border border-dashed p-8 text-center text-sm">
          No team members published yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <Card key={member.id} className="overflow-hidden pt-0">
              <div className="bg-muted relative aspect-square">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={member.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <User
                    className="text-muted-foreground absolute inset-0 m-auto size-10"
                    aria-hidden
                  />
                )}
              </div>
              <CardContent>
                <h2 className="font-medium">{member.name}</h2>
                {member.designation ? (
                  <p className="text-primary text-sm">{member.designation}</p>
                ) : null}

                {member.qualifications.length > 0 ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    {member.qualifications.join(", ")}
                  </p>
                ) : null}

                {member.specialties.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {member.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {member.bioHtml ? (
                  <div
                    className="prose-cms text-muted-foreground mt-3 text-sm"
                    // Sanitised on write in the repository — safe to render.
                    dangerouslySetInnerHTML={{ __html: member.bioHtml }}
                  />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
