import { NextResponse } from "next/server";
import { createCustomerPortalSession } from "@/app/(dashboard)/billing/actions";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await createCustomerPortalSession();
  
  if (res.success && res.url) {
    return NextResponse.redirect(res.url);
  }
  
  // Fallback if there is an error
  const hostList = headers();
  const host = hostList.get("host") || "";
  const protocol = host.includes("localhost") ? "http" : "https";
  const errorMessage = encodeURIComponent(res.message || "No se pudo acceder al portal");

  return NextResponse.redirect(new URL(`/activity?error=billing&message=${errorMessage}`, `${protocol}://${host}`));
}
