import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, webhook-id, webhook-signature, webhook-timestamp",
};

function verifyWebhookSignature(body: string, headers: Headers): boolean {
  const secret = Deno.env.get("DODO_WEBHOOK_SECRET");
  if (!secret) {
    console.error("DODO_WEBHOOK_SECRET not configured");
    return false;
  }

  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.error("Missing webhook verification headers");
    return false;
  }

  // Check timestamp to prevent replay attacks (5 min tolerance)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(webhookTimestamp, 10);
  if (Math.abs(now - ts) > 300) {
    console.error("Webhook timestamp too old");
    return false;
  }

  // Dodo uses base64-encoded secret prefixed with "whsec_"
  const secretBytes = Uint8Array.from(atob(secret.replace("whsec_", "")), (c) => c.charCodeAt(0));
  const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;

  const encoder = new TextEncoder();
  const key = secretBytes;
  const message = encoder.encode(signedContent);

  // Compute HMAC-SHA256
  const computedSignature = hmac("sha256", key, message, "utf8", "base64");

  // Dodo sends multiple signatures separated by space, each prefixed with "v1,"
  const signatures = webhookSignature.split(" ");
  for (const sig of signatures) {
    const sigValue = sig.replace("v1,", "");
    if (sigValue === computedSignature) {
      return true;
    }
  }

  console.error("Signature mismatch");
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(body, req.headers)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(body);
    const eventType = payload.type || payload.event_type;

    console.log("Webhook event:", eventType);

    if (eventType !== "payment.succeeded") {
      // Acknowledge non-payment events
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = payload.data || payload;
    const metadata = data.metadata || {};
    const userId = metadata.user_id;
    const packageName = metadata.package_name;
    const creditsToAdd = parseInt(metadata.credits_to_add || "0", 10);
    const paymentId = data.payment_id || data.id;
    const currency = data.currency || "USD";
    const totalAmount = data.total_amount || data.amount || 0;

    if (!userId || !creditsToAdd) {
      console.error("Missing user_id or credits_to_add in metadata");
      return new Response(JSON.stringify({ error: "Missing metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for duplicate payment
    const { data: existing } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (existing) {
      console.log("Duplicate payment, skipping:", paymentId);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert transaction record
    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id: userId,
      type: "purchase",
      credits_added: creditsToAdd,
      amount_paid: totalAmount / 100, // Dodo sends amounts in cents
      currency,
      package_name: packageName,
      payment_id: paymentId,
      payment_provider: "dodo_payments",
    });

    if (txError) {
      console.error("Failed to insert transaction:", txError);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update credits balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_balance, full_name, email")
      .eq("user_id", userId)
      .single();

    if (profile) {
      const newBalance = (profile.credits_balance || 0) + creditsToAdd;
      await supabase
        .from("profiles")
        .update({ credits_balance: newBalance })
        .eq("user_id", userId);

      console.log(`Added ${creditsToAdd} credits to user ${userId}. New balance: ${newBalance}`);
    }

    return new Response(JSON.stringify({ received: true, credits_added: creditsToAdd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
