import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_IDS: Record<string, Record<string, string>> = {
  starter: {
    USD: Deno.env.get("DODO_STARTER_USD_ID") || "",
    INR: Deno.env.get("DODO_STARTER_INR_ID") || "",
  },
  standard: {
    USD: Deno.env.get("DODO_STANDARD_USD_ID") || "",
    INR: Deno.env.get("DODO_STANDARD_INR_ID") || "",
  },
  pro: {
    USD: Deno.env.get("DODO_PRO_USD_ID") || "",
    INR: Deno.env.get("DODO_PRO_INR_ID") || "",
  },
};

const PACKAGE_CREDITS: Record<string, number> = {
  starter: 30,
  standard: 100,
  pro: 300,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { package_name, currency, user_id, user_email, user_name, country } = await req.json();

    if (!package_name || !currency || !user_id || !user_email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productId = PRODUCT_IDS[package_name]?.[currency];
    if (!productId) {
      return new Response(JSON.stringify({ error: "Invalid package or currency" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const credits = PACKAGE_CREDITS[package_name] || 0;
    const DODO_API_KEY = Deno.env.get("DODO_API_KEY");
    if (!DODO_API_KEY) {
      return new Response(JSON.stringify({ error: "Payment service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const APP_URL = Deno.env.get("APP_URL") || "https://id-preview--51db6d68-273a-4b34-84f8-ddef6668b10c.lovable.app";

    const dodoResponse = await fetch("https://api.dodopayments.com/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing: {
          city: "N/A",
          country: country || "US",
          state: "N/A",
          street: "N/A",
          zipcode: "00000",
        },
        customer: {
          email: user_email,
          name: user_name || "User",
        },
        metadata: {
          user_id,
          package_name,
          credits_to_add: credits.toString(),
        },
        payment_link: true,
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        return_url: `${APP_URL}/app/credits?success=true`,
      }),
    });

    if (!dodoResponse.ok) {
      const errText = await dodoResponse.text();
      console.error("Dodo API error:", errText);
      return new Response(JSON.stringify({ error: "Payment creation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dodoData = await dodoResponse.json();

    return new Response(JSON.stringify({ payment_link: dodoData.payment_link }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
