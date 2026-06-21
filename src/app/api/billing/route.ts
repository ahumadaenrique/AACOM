import { NextResponse } from "next/server";
import { createCustomerPortalSession } from "@/app/(dashboard)/billing/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await createCustomerPortalSession();
  
  if (res.success && res.url) {
    return NextResponse.redirect(res.url);
  }
  
  // Fallback if there is an error
  return NextResponse.redirect(new URL("/activity?error=billing", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
