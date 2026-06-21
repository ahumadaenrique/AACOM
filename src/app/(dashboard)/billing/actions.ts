"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function createCustomerPortalSession() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, message: "No autorizado" };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { agency: true }
    });

    if (!user || !user.agency) {
      return { success: false, message: "Agencia no encontrada" };
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { success: false, message: "Solo el administrador de la agencia puede acceder al portal de facturación." };
    }

    const { stripeCustomerId, slug } = user.agency;

    if (!stripeCustomerId) {
      return { success: false, message: "La agencia no tiene un método de pago asociado todavía." };
    }

    const hostList = headers();
    const host = hostList.get("host") || "";
    const protocol = host.includes("localhost") ? "http" : "https";
    
    // El usuario volverá al panel de configuración de la agencia (o al inicio)
    const returnUrl = `${protocol}://${slug}.${host.replace("www.", "")}/activity`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { success: true, url: portalSession.url };
  } catch (error: any) {
    console.error("Error creating portal session:", error);
    return { success: false, message: "Hubo un error al contactar al proveedor de pagos." };
  }
}
