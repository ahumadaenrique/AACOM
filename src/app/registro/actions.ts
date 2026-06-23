"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function checkSlugAvailability(slug: string) {
  if (!slug || slug.length < 2) return false;
  const existing = await prisma.agency.findUnique({
    where: { slug }
  });
  return !existing;
}

export async function validateCode(code: string) {
  if (!code || code.trim() === "") return { valid: false, type: "none" };
  
  // 1. Check if it's a discount code
  const discount = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });
  if (discount && discount.active) {
    if (discount.maxUses && discount.uses >= discount.maxUses) {
      return { valid: false, message: "Este código de descuento ya alcanzó su límite de usos." };
    }
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return { valid: false, message: "Este código de descuento ha expirado." };
    }
    return { valid: true, type: "discount", name: `Descuento del ${discount.discountPercentage}%`, code: discount.code };
  }
  
  // 2. Check if it's an agency slug (referral)
  const agency = await prisma.agency.findUnique({ where: { slug: code.toLowerCase() } });
  if (agency && agency.active) {
    return { valid: true, type: "referral", name: `Invitado por ${agency.name}`, slug: agency.slug };
  }
  
  return { valid: false, message: "El código ingresado no es válido." };
}

export async function processRegistration(data: any) {
  try {
    const { name, email, phone, password, agencyName, agencySlug, agencyColor, priceId, daysToAdd, refSlug } = data;

    // Validate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: "El correo electrónico ya está registrado." };
    }

    // Validate slug again just in case
    const existingAgency = await prisma.agency.findUnique({ where: { slug: agencySlug } });
    if (existingAgency) {
      return { success: false, message: "El nombre de la plataforma (slug) ya no está disponible." };
    }

    // Check referrer or promoCode
    let referredByAgencyId = null;
    let stripeCoupon = null;

    if (data.promoCode) {
      const validation = await validateCode(data.promoCode);
      if (validation.valid && validation.type === "referral") {
        const referrer = await prisma.agency.findUnique({ where: { slug: validation.slug } });
        if (referrer) referredByAgencyId = referrer.id;
      } else if (validation.valid && validation.type === "discount") {
        stripeCoupon = validation.code;
      }
    } else if (refSlug) {
      const referrer = await prisma.agency.findUnique({ where: { slug: refSlug } });
      if (referrer) referredByAgencyId = referrer.id;
    }

    // Calculate trial end date (5 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 5);

    // Create the Agency with trialing status and +5 days
    const newAgency = await prisma.agency.create({
      data: {
        name: agencyName,
        slug: agencySlug,
        primaryColor: agencyColor || "#4f46e5",
        subscriptionStatus: "trialing",
        subscriptionEndDate: trialEndDate,
        active: true,
        referredByAgencyId,
      }
    });

    // Create the Admin User
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // Using plain text to match existing auth logic
        phone,
        role: "ADMIN",
        agencyId: newAgency.id,
        active: true,
      }
    });

    // Create Stripe Customer to store it early
    const customer = await stripe.customers.create({
      email: newUser.email,
      name: newAgency.name,
      metadata: {
        agencyId: newAgency.id,
      },
    });

    // Update agency with customer ID
    await prisma.agency.update({
      where: { id: newAgency.id },
      data: { stripeCustomerId: customer.id }
    });

    // No checkout session generated here, return success directly for Freemium model
    return { success: true, url: `/login?welcome=true` };
  } catch (error: any) {
    console.error("Error in processRegistration:", error);
    return { success: false, message: error.message || "Ocurrió un error inesperado al procesar el registro." };
  }
}
