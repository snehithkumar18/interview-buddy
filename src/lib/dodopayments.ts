import { supabase } from "@/integrations/supabase/client";

export const PACKAGES = {
  starter: {
    name: "Starter",
    credits: 30,
    usd_price: 3,
    inr_price: 199,
  },
  standard: {
    name: "Standard",
    credits: 100,
    usd_price: 7,
    inr_price: 499,
  },
  pro: {
    name: "Pro",
    credits: 300,
    usd_price: 17,
    inr_price: 1199,
  },
} as const;

export type PackageName = keyof typeof PACKAGES;

export async function createCheckout(
  packageName: PackageName,
  currency: "USD" | "INR",
  userEmail: string,
  userId: string,
  userName: string,
  countryCode: string
) {
  const { data, error } = await supabase.functions.invoke("dodo-create-checkout", {
    body: {
      package_name: packageName,
      currency,
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      country: countryCode,
    },
  });

  if (error) throw new Error(error.message || "Failed to create checkout");
  if (!data?.payment_link) throw new Error("No checkout URL returned");

  window.location.href = data.payment_link;
}
