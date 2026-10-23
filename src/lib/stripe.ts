import Stripe from "stripe";

if (typeof window !== "undefined") {
  throw new Error("El cliente de servidor de Stripe no puede ejecutarse en el navegador.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key_for_build", {
  apiVersion: "2026-05-27.dahlia", // Use the latest supported version
  typescript: true,
  appInfo: {
    name: "AACOM SaaS",
    version: "1.0.0",
  },
});
