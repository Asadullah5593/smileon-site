import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";

export const dynamic = "force-dynamic";

/** Liveness + database probe for load balancers and uptime monitors. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("[health] database probe failed", error);
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
