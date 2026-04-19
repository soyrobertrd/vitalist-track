// Edge function: payments-checkout
// Skeleton ready to wire Stripe or Paddle.
// Returns 501 until a provider key is configured.
//
// When ready, set one of:
//   - STRIPE_SECRET_KEY  → Stripe Checkout Session
//   - PADDLE_API_KEY     → Paddle Transaction
//
// The function expects: { plan_codigo: string, workspace_id: string }
// and returns: { url: string } pointing to the hosted checkout.

// deno-lint-ignore-file no-explicit-any
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckoutBody {
  plan_codigo: string;
  workspace_id: string;
  success_url?: string;
  cancel_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as CheckoutBody;
    if (!body?.plan_codigo || !body?.workspace_id) {
      return new Response(
        JSON.stringify({ error: "plan_codigo and workspace_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const paddleKey = Deno.env.get("PADDLE_API_KEY");

    if (!stripeKey && !paddleKey) {
      return new Response(
        JSON.stringify({
          error: "no_payment_provider_configured",
          message:
            "Payment gateway is not configured yet. Add STRIPE_SECRET_KEY or PADDLE_API_KEY to enable checkout.",
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // TODO: Implement provider-specific checkout creation.
    // The provider call should return a hosted checkout URL.
    return new Response(
      JSON.stringify({
        error: "not_implemented",
        message: "Provider key detected but checkout flow is not implemented yet.",
      }),
      { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[payments-checkout] error", err);
    return new Response(
      JSON.stringify({ error: "internal_error", message: err?.message || "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
