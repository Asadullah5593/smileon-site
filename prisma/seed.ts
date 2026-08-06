import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PERMISSIONS, SYSTEM_ROLES } from "../src/shared/auth/permission-registry";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");

const parsed = new URL(url);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  }),
});

/**
 * Idempotent: safe to run on every deploy. It syncs the permission registry,
 * ensures the system roles exist, creates the first super admin if there isn't
 * one, and adds a little demo content so a fresh checkout isn't a blank site.
 */
async function main() {
  await syncPermissions();
  const roles = await ensureSystemRoles();
  await ensureFirstAdmin(roles.superAdmin.id);
  await seedDemoContent();
}

/** Code is the source of truth for what permissions exist. */
async function syncPermissions() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {
        resource: permission.resource,
        action: permission.action,
        group: permission.group,
        description: permission.description,
      },
      create: permission,
    });
  }

  const stale = await prisma.permission.findMany({
    where: { name: { notIn: PERMISSIONS.map((p) => p.name) } },
    select: { id: true, name: true },
  });
  if (stale.length > 0) {
    await prisma.permission.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    console.log(`  pruned ${stale.length} permission(s) no longer in the registry`);
  }

  console.log(`✔ synced ${PERMISSIONS.length} permissions`);
}

const byResource = (...resources: string[]) =>
  PERMISSIONS.filter((p) => resources.includes(p.resource)).map((p) => p.name);

const CONTENT_RESOURCES = [
  "services",
  "pages",
  "posts",
  "team",
  "testimonials",
  "faqs",
  "gallery",
  "taxonomy",
];

async function ensureSystemRoles() {
  const definitions = [
    {
      slug: SYSTEM_ROLES.superAdmin,
      name: "Super Admin",
      description: "Full access to everything, including roles and permissions.",
      isSuperAdmin: true,
      permissions: [] as string[],
    },
    {
      slug: SYSTEM_ROLES.administrator,
      name: "Administrator",
      description: "Manages content, media, enquiries, site settings and users.",
      isSuperAdmin: false,
      permissions: PERMISSIONS.filter((p) => p.resource !== "roles").map((p) => p.name),
    },
    {
      slug: SYSTEM_ROLES.contentEditor,
      name: "Content Editor",
      description: "Creates and publishes content, and manages the media library.",
      isSuperAdmin: false,
      permissions: [...byResource(...CONTENT_RESOURCES), ...byResource("media")],
    },
    {
      slug: SYSTEM_ROLES.author,
      name: "Author",
      description: "Writes blog posts and uploads media, but cannot publish.",
      isSuperAdmin: false,
      permissions: [
        "posts.read",
        "posts.create",
        "posts.update",
        "taxonomy.read",
        "media.read",
        "media.upload",
      ],
    },
    {
      slug: SYSTEM_ROLES.frontDesk,
      name: "Front Desk",
      description: "Handles appointment requests and contact messages only.",
      isSuperAdmin: false,
      permissions: [...byResource("appointments"), ...byResource("messages")],
    },
  ];

  const result: Record<string, { id: string }> = {};

  for (const definition of definitions) {
    const role = await prisma.role.upsert({
      where: { slug: definition.slug },
      update: {
        name: definition.name,
        description: definition.description,
        isSystem: true,
        isSuperAdmin: definition.isSuperAdmin,
      },
      create: {
        slug: definition.slug,
        name: definition.name,
        description: definition.description,
        isSystem: true,
        isSuperAdmin: definition.isSuperAdmin,
      },
    });

    if (definition.permissions.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: { name: { in: definition.permissions } },
        select: { id: true },
      });
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
      await prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
      });
    }

    result[definition.slug] = role;
  }

  console.log(`✔ ensured ${definitions.length} system roles`);
  return { superAdmin: result[SYSTEM_ROLES.superAdmin] };
}

async function ensureFirstAdmin(superAdminRoleId: string) {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@smileon.pk").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✔ admin ${email} already exists`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: "SmileOn Admin",
      passwordHash: await bcrypt.hash(password, 12),
      roles: { create: { roleId: superAdminRoleId } },
    },
  });

  console.log(`✔ created super admin ${user.email} (password: ${password})`);
  console.log("  ⚠ change this password after your first sign-in");
}

async function seedDemoContent() {
  if ((await prisma.service.count()) > 0) {
    console.log("✔ demo content already present — skipping");
    return;
  }

  await prisma.location.create({
    data: {
      name: "SmileOn Johar Town",
      address: "335-B Iqbal Avenue, Khayaban-e-Jinnah Service Road, Lahore",
      city: "Lahore",
      phone: "+92 300 0000000",
      isPrimary: true,
      openingHours: {
        monToSat: "11:00–21:00",
        sunday: "13:00–18:00",
      },
    },
  });

  const services = [
    {
      slug: "dental-implants",
      title: "Dental Implants",
      summary: "A permanent replacement for missing teeth that looks and works like the real thing.",
      duration: "60–90 minutes",
      isFeatured: true,
      sortOrder: 1,
    },
    {
      slug: "teeth-whitening",
      title: "Teeth Whitening",
      summary: "In-clinic whitening that lifts years of staining in a single visit.",
      duration: "45 minutes",
      isFeatured: true,
      sortOrder: 2,
    },
    {
      slug: "clear-aligners",
      title: "Clear Aligners",
      summary: "Straighten your teeth discreetly with a custom set of removable aligners.",
      duration: "Ongoing",
      isFeatured: true,
      sortOrder: 3,
    },
    {
      slug: "root-canal-treatment",
      title: "Root Canal Treatment",
      summary: "Save an infected tooth and end the pain, usually in one or two appointments.",
      duration: "60 minutes",
      sortOrder: 4,
    },
    {
      slug: "scaling-and-polishing",
      title: "Scaling & Polishing",
      summary: "A professional clean that removes plaque and tartar brushing can't reach.",
      duration: "30 minutes",
      sortOrder: 5,
    },
    {
      slug: "emergency-dental-care",
      title: "Emergency Dental Care",
      summary: "Same-day appointments for pain, swelling, or a broken tooth.",
      duration: "As needed",
      sortOrder: 6,
    },
  ];

  for (const service of services) {
    await prisma.service.create({
      data: {
        ...service,
        status: "PUBLISHED",
        publishedAt: new Date(),
        bodyHtml: `<p>${service.summary}</p><p>Replace this text with the real treatment description from the CMS.</p>`,
      },
    });
  }

  await prisma.teamMember.createMany({
    data: [
      { slug: "dr-ayesha-khan", name: "Dr. Ayesha Khan", designation: "Cosmetic Dentist", status: "PUBLISHED", sortOrder: 1 },
      { slug: "dr-hamza-ali", name: "Dr. Hamza Ali", designation: "Implantologist", status: "PUBLISHED", sortOrder: 2 },
      { slug: "dr-sana-tariq", name: "Dr. Sana Tariq", designation: "Orthodontist", status: "PUBLISHED", sortOrder: 3 },
      { slug: "dr-bilal-ahmed", name: "Dr. Bilal Ahmed", designation: "Endodontist", status: "PUBLISHED", sortOrder: 4 },
    ],
  });

  await prisma.testimonial.createMany({
    data: [
      { patientName: "Farah S.", quote: "Painless, quick, and the team explained every step.", rating: 5, status: "PUBLISHED", sortOrder: 1 },
      { patientName: "Usman R.", quote: "My implant looks completely natural. Worth every rupee.", rating: 5, status: "PUBLISHED", sortOrder: 2 },
      { patientName: "Hina M.", quote: "Booked online in the evening and was seen the next morning.", rating: 5, status: "PUBLISHED", sortOrder: 3 },
    ],
  });

  await prisma.faqItem.createMany({
    data: [
      { question: "Do I need a referral?", answerHtml: "<p>No — you can book directly through the website or by phone.</p>", status: "PUBLISHED", sortOrder: 1 },
      { question: "Does it hurt?", answerHtml: "<p>Most treatments are done under local anaesthetic, so you'll feel pressure but not pain.</p>", status: "PUBLISHED", sortOrder: 2 },
      { question: "How do I pay?", answerHtml: "<p>Cash, card and bank transfer are all accepted at the clinic.</p>", status: "PUBLISHED", sortOrder: 3 },
    ],
  });

  await prisma.menu.create({
    data: {
      slug: "header",
      name: "Header",
      items: {
        create: [
          { label: "Treatments", href: "/services", sortOrder: 1 },
          { label: "Book appointment", href: "/contact", sortOrder: 2 },
        ],
      },
    },
  });

  await prisma.siteSetting.createMany({
    data: [
      { key: "brand", value: { name: "SmileOn Dental Clinic", tagline: "A healthier smile, handled by specialists" } },
      { key: "contact", value: { phone: "+92 300 0000000", email: "hello@smileon.pk" } },
      { key: "socials", value: { facebook: "", instagram: "", youtube: "" } },
    ],
  });

  console.log("✔ seeded demo content");
}

main()
  .then(() => console.log("\nSeed complete."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
