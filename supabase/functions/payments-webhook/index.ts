// Edge function: payments-webhook
// Receives provider events (Stripe / Paddle) and persists changes into:
//   - subscripciones_workspace
//   - pagos_workspace
//   - workspaces.plan_codigo (when subscription status changes)
//
// Skeleton: validates signature header is present, returns 200 to ACK,
// and logs the event. Replace the verify+dispatch block when wiring a provider.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, paddle-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSig = req.headers.get("stripe-signature");
  const paddleSig = req.headers.get("paddle-signature");
  const provider = stripeSig ? "stripe" : paddleSig ? "paddle" : "unknown";

  try {
    const rawBody = await req.text();

    // TODO: signature verification per provider.
    // - Stripe: stripe.webhooks.constructEvent(rawBody, stripeSig, STRIPE_WEBHOOK_SECRET)
    // - Paddle: HMAC-SHA256 against PADDLE_WEBHOOK_SECRET
    if (provider === "unknown") {
      return new Response(JSON.stringify({ error: "unknown_provider" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[payments-webhook] provider=${provider} type=${event?.type ?? event?.event_type ?? "unknown"}`);

    // TODO: dispatch by event.type and update subscripciones_workspace + pagos_workspace.
    // Example expected types:
    //   stripe: customer.subscription.created/updated/deleted, invoice.paid, invoice.payment_failed
    //   paddle: subscription.created/updated/canceled, transaction.completed

    // Acknowledge receipt — providers retry on non-2xx.
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[payments-webhook] error", err);
    return new Response(JSON.stringify({ error: "internal_error", message: err?.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
